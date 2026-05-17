import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { GroqClientService } from '../ai/groq.client';
import * as pdfParse from 'pdf-parse';

interface ParsedQuestion {
  question: string;
  options: string[];
  answer: string;
  explanation?: string;
}

interface ParseResult {
  questions: ParsedQuestion[];
  totalExtracted: number;
  pdfPageCount: number;
  pdfCharCount: number;
  model: string;
  latencyMs: number;
}

@Injectable()
export class PdfImportService {
  private readonly logger = new Logger(PdfImportService.name);

  constructor(
    private prisma: PrismaService,
    private groq: GroqClientService,
  ) {}

  async parsePdfAndExtractQuestions(params: {
    buffer: Buffer;
    subjectId: string;
    topic: string;
    difficulty: number;
  }): Promise<ParseResult> {
    // 1. PDF dan matnni ajratib olish
    let pdfData: { text: string; numpages: number };
    try {
      pdfData = await (pdfParse as any)(params.buffer);
    } catch (err) {
      this.logger.error(`PDF parse xatosi: ${err}`);
      throw new BadRequestException('PDF faylni o\'qib bo\'lmadi. Fayl buzilgan bo\'lishi mumkin.');
    }

    const rawText = pdfData.text?.trim() || '';
    if (rawText.length < 50) {
      throw new BadRequestException('PDF fayl bo\'sh yoki matn ajratib bo\'lmadi (scan qilingan rasmli PDF bo\'lishi mumkin).');
    }

    // Matnni maksimal 8000 ta belgiga qisqartirish (token limiti uchun)
    const truncatedText = rawText.length > 8000 ? rawText.slice(0, 8000) + '\n...[qolgan qismi qisqartirildi]' : rawText;

    this.logger.log(`PDF o'qildi: ${pdfData.numpages} bet, ${rawText.length} belgi`);

    // 2. Groq AI orqali savollar yaratish
    const systemPrompt = `Sen O'zbekiston ta'lim tizimi uchun test savollari yaratuvchi AI assistantsan.
Berilgan matndan test savollari ajratib ol va JSON formatida qaytar.

MUHIM QOIDALAR:
- Faqat matnda ANIQ mavjud bo'lgan ma'lumotlarga asoslangan savollar tuz
- Har bir savol aniq va tushunarli bo'lsin
- 4 ta variant ber (A, B, C, D)
- To'g'ri javob variants ichida bo'lsin
- answer maydoni 0-3 orasidagi indeks bo'lsin (0=A, 1=B, 2=C, 3=D)

Javob faqat JSON formatida bo'lsin:
{
  "questions": [
    {
      "question": "Savol matni?",
      "options": ["A variant", "B variant", "C variant", "D variant"],
      "answer": "0",
      "explanation": "To'g'ri javob izohi (ixtiyoriy)"
    }
  ]
}`;

    const userPrompt = `Quyidagi matndan test savollari ajratib ol (mavzu: ${params.topic}):

${truncatedText}

Kamida 5 ta, maksimal 30 ta savol qaytar. Savollar matnning asosiy g'oyalarini o'z ichiga olsin.`;

    const started = Date.now();
    const result = await this.groq.chatJson<{ questions: ParsedQuestion[] }>({
      system: systemPrompt,
      user: userPrompt,
      maxTokens: 4096,
      temperature: 0.3,
    });

    const questions = (result.parsed.questions || []).filter(
      (q) =>
        q.question &&
        Array.isArray(q.options) &&
        q.options.length >= 2 &&
        q.answer !== undefined,
    );

    this.logger.log(`AI ${questions.length} ta savol yaratdi`);

    return {
      questions,
      totalExtracted: questions.length,
      pdfPageCount: pdfData.numpages,
      pdfCharCount: rawText.length,
      model: result.model,
      latencyMs: result.latencyMs,
    };
  }

  async saveQuestions(dto: {
    subjectId: string;
    topic: string;
    difficulty: number;
    questions: {
      question: string;
      options: string[];
      answer: string;
      explanation?: string;
    }[];
  }): Promise<{ saved: number; subjectId: string }> {
    // Fan mavjudligini tekshirish
    const subject = await this.prisma.subject.findUnique({
      where: { id: dto.subjectId },
    });
    if (!subject) {
      throw new BadRequestException('Fan topilmadi');
    }

    // Bulk yaratish
    await this.prisma.questionBankItem.createMany({
      data: dto.questions.map((q) => ({
        subjectId: dto.subjectId,
        question: q.question,
        type: 'MCQ',
        options: q.options,
        answer: String(q.answer),
        explanation: q.explanation || null,
        topic: dto.topic || 'Umumiy',
        difficulty: dto.difficulty || 2,
        isActive: true,
      })),
    });

    this.logger.log(`${dto.questions.length} ta savol QuestionBank ga saqlandi`);

    return { saved: dto.questions.length, subjectId: dto.subjectId };
  }
}
