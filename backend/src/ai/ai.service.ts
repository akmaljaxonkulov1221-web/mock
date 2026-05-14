import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { GroqClientService } from './groq.client';
import { StorageService } from '../storage/storage.service';

type WritingAiJson = {
  overallScore: number;
  grammarScore: number;
  vocabularyScore: number;
  coherenceScore: number;
  estimatedCEFR: string;
  feedbackUz: string;
  grammarAnalysis?: Record<string, unknown>;
  vocabularyAnalysis?: Record<string, unknown>;
  coherenceAnalysis?: Record<string, unknown>;
};

type PronunciationAnalysisUz = {
  strengthsUz: string;
  issuesUz: string;
  stressAndLinkingUz: string;
};

type FluencyAnalysisUz = {
  paceAndRhythmUz: string;
  hesitationUz: string;
  coherenceSpokenUz: string;
};

type SpeakingAiJson = {
  fluencyScore: number;
  grammarScore: number;
  pronunciationScore: number;
  overallScore: number;
  estimatedSpeakingCEFR: string;
  feedbackUz: string;
  pronunciationAnalysis: PronunciationAnalysisUz;
  fluencyAnalysis: FluencyAnalysisUz;
};

type RoadmapAiJson = {
  currentLevel: string;
  targetLevel: string;
  weakSkills: string[];
  studyPlan: { day: number; task: string; duration: string }[];
};

type CefrPredictJson = {
  estimatedLevel: string;
  confidence: number;
  rationaleUz: string;
};

const CEFR_LEVELS = new Set(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']);

function clampScore(n: unknown, fallback = 50): number {
  const x = typeof n === 'number' ? n : Number(n);
  if (!Number.isFinite(x)) return fallback;
  return Math.min(100, Math.max(0, Math.round(x)));
}

function normalizeCefr(raw: unknown): string {
  const s = String(raw ?? '').trim().toUpperCase();
  if (CEFR_LEVELS.has(s)) return s;
  return 'B1';
}

function normalizeSpeakingAiJson(raw: Record<string, unknown>): SpeakingAiJson {
  const pr = (raw.pronunciationAnalysis ?? {}) as Record<string, unknown>;
  const fl = (raw.fluencyAnalysis ?? {}) as Record<string, unknown>;
  return {
    fluencyScore: clampScore(raw.fluencyScore),
    grammarScore: clampScore(raw.grammarScore),
    pronunciationScore: clampScore(raw.pronunciationScore),
    overallScore: clampScore(raw.overallScore),
    estimatedSpeakingCEFR: normalizeCefr(raw.estimatedSpeakingCEFR),
    feedbackUz: String(raw.feedbackUz ?? raw.feedback ?? '').trim() || 'Javob qisqa keldi.',
    pronunciationAnalysis: {
      strengthsUz: String(pr.strengthsUz ?? '').trim() || '—',
      issuesUz: String(pr.issuesUz ?? '').trim() || '—',
      stressAndLinkingUz: String(pr.stressAndLinkingUz ?? '').trim() || '—',
    },
    fluencyAnalysis: {
      paceAndRhythmUz: String(fl.paceAndRhythmUz ?? '').trim() || '—',
      hesitationUz: String(fl.hesitationUz ?? '').trim() || '—',
      coherenceSpokenUz: String(fl.coherenceSpokenUz ?? '').trim() || '—',
    },
  };
}

/** Pause / timing stats from Whisper segment timestamps (seconds). */
function pauseMetricsFromSegments(
  segments: { start: number; end: number }[] | undefined,
  transcript: string,
): Record<string, unknown> {
  const words = transcript.trim().split(/\s+/).filter(Boolean).length;
  if (!segments?.length) {
    return {
      source: 'groq_whisper',
      segmentCount: 0,
      wordCount: words,
      longPausesOver1_5s: 0,
      pausesOver0_5s: 0,
      maxGapSec: 0,
      totalSpeechSec: 0,
      audioDurationSec: null,
      totalPauseSec: null,
      speechRatioApprox: null,
      wordsPerMinuteApprox: null,
    };
  }

  let totalSpeech = 0;
  for (const s of segments) {
    totalSpeech += Math.max(0, s.end - s.start);
  }

  let longPauses = 0;
  let pausesHalf = 0;
  let maxGap = 0;
  for (let i = 0; i < segments.length - 1; i++) {
    const gap = Math.max(0, segments[i + 1].start - segments[i].end);
    if (gap > maxGap) maxGap = gap;
    if (gap >= 1.5) longPauses++;
    if (gap >= 0.5) pausesHalf++;
  }

  const audioDurationSec = Math.max(...segments.map((s) => s.end));
  const totalPauseSec = Math.max(0, audioDurationSec - totalSpeech);
  const speechRatioApprox = audioDurationSec > 0 ? totalSpeech / audioDurationSec : null;
  const wordsPerMinuteApprox =
    audioDurationSec > 0 && words > 0 ? Math.round((words / audioDurationSec) * 60) : null;

  return {
    source: 'groq_whisper',
    segmentCount: segments.length,
    wordCount: words,
    longPausesOver1_5s: longPauses,
    pausesOver0_5s: pausesHalf,
    maxGapSec: maxGap,
    totalSpeechSec: totalSpeech,
    audioDurationSec,
    totalPauseSec,
    speechRatioApprox,
    wordsPerMinuteApprox,
  };
}

const SPEAKING_JSON_SYSTEM = `Sen CEFR og‘zaki nutq (speaking) bo‘yicha senior ekspertsan.
Faqat bitta JSON obyekt qaytaring (boshqa matn yo‘q). Barcha tahlil matnlari o‘zbek tilida bo‘lsin.

Maydonlar (butun sonlar 0–100):
- fluencyScore: ravonlik, tezlik, to‘xtashlar muvozanati
- grammarScore: og‘zaki grammatika
- pronunciationScore: talaffuz va tushunarliqlik (audio transkripti asosida taxminiy)
- overallScore: umumiy nutq sifati
- estimatedSpeakingCEFR: faqat bittasi: "A1"|"A2"|"B1"|"B2"|"C1"|"C2"
- feedbackUz: batafsil mulohaza (kamida 5 jumla), aniq tavsiyalar
- pronunciationAnalysis: {
    "strengthsUz": "talaffuzdagi kuchli tomonlar",
    "issuesUz": "aniqlangan muammolar va tuzatish",
    "stressAndLinkingUz": "urg‘u va bog‘lovchi tovushlar"
  }
- fluencyAnalysis: {
    "paceAndRhythmUz": "sur’at va ritm",
    "hesitationUz": "to‘xtash, uh/um kabi to‘ldiruvchilar, pauzalar ta’siri",
    "coherenceSpokenUz": "fikr izchiligi va bog‘lanish"
  }

Transkript va pauza statistikasi beriladi. Transkript juda qisqa bo‘lsa, ballarni pastroq qo‘ying va feedbackda "uzoqroq gapiring" deb yozing.`;

@Injectable()
export class AiService {
  constructor(
    private prisma: PrismaService,
    private groq: GroqClientService,
    private storage: StorageService,
  ) {}

  private async logUsage(input: {
    userId?: string | null;
    endpoint: string;
    model: string;
    inputTokens?: number;
    outputTokens?: number;
    latencyMs: number;
    success?: boolean;
  }) {
    await this.prisma.aiUsageLog.create({
      data: {
        userId: input.userId ?? undefined,
        endpoint: input.endpoint,
        model: input.model,
        inputTokens: input.inputTokens,
        outputTokens: input.outputTokens,
        latencyMs: input.latencyMs,
        success: input.success ?? true,
      },
    });
  }

  async analyzeWriting(userId: string, essay: string) {
    const wordCount = essay.trim().split(/\s+/).filter(Boolean).length;
    if (wordCount < 10) {
      throw new BadRequestException('Kamida 10 ta so‘z yozing');
    }

    const system = `Sen professional CEFR yozma baholash mutaxissisan. Javobni FAQAT JSON qilib qaytara olasan.
Maydonlar (0-100 oralig‘ida ballar, CEFR: A1|A2|B1|B2|C1|C2):
- overallScore, grammarScore, vocabularyScore, coherenceScore
- estimatedCEFR
- feedbackUz: o‘zbek tilida batafsil fikr-mulohaza (kamida 4 jumla)
- grammarAnalysis: { "issues": [ {"quote": "...", "fixUz": "..."} ] }
- vocabularyAnalysis: { "rangeUz": "...", "strongUz": "...", "improveUz": "..." }
- coherenceAnalysis: { "structureUz": "...", "cohesionUz": "..." }`;

    const user = `Quyidagi inshoni baholang (matn o‘zbek/ingliz aralash bo‘lishi mumkin, lekin fikrlar o‘zbekcha bo‘lsin):\n\n${essay}`;

    const { parsed, usage, latencyMs, model } = await this.groq.chatJson<WritingAiJson>({
      system,
      user,
      maxTokens: 2500,
      temperature: 0.25,
    });

    await this.logUsage({
      userId,
      endpoint: 'ai.writing',
      model,
      inputTokens: usage.input,
      outputTokens: usage.output,
      latencyMs,
    });

    const submission = await this.prisma.writingSubmission.create({
      data: {
        userId,
        essay,
        wordCount,
        grammarScore: Math.round(parsed.grammarScore),
        vocabScore: Math.round(parsed.vocabularyScore),
        coherenceScore: Math.round(parsed.coherenceScore),
        aiFeedback: parsed.feedbackUz,
        estimatedLevel: parsed.estimatedCEFR,
        grammarAnalysis: (parsed.grammarAnalysis ?? {}) as object,
        vocabularyAnalysis: (parsed.vocabularyAnalysis ?? {}) as object,
        coherenceAnalysis: (parsed.coherenceAnalysis ?? {}) as object,
      },
    });

    await this.prisma.aiReport.create({
      data: {
        userId,
        kind: 'WRITING',
        model,
        tokensUsed: (usage.input ?? 0) + (usage.output ?? 0),
        payload: {
          submissionId: submission.id,
          overallScore: parsed.overallScore,
          grammarScore: submission.grammarScore,
          vocabScore: submission.vocabScore,
          coherenceScore: submission.coherenceScore,
          estimatedLevel: submission.estimatedLevel,
        },
      },
    });

    return submission;
  }

  async analyzeSpeakingFromAudio(userId: string, buffer: Buffer, filename: string, mimeType: string) {
    if (!buffer?.length) {
      throw new BadRequestException('Audio bo‘sh');
    }

    const { storageKey: audioStorageKey } = await this.storage.saveSpeakingAudio(buffer, mimeType, filename);

    const stt = await this.groq.transcribeAudio({ buffer, filename, mimeType });
    await this.logUsage({
      userId,
      endpoint: 'ai.speaking.stt',
      model: stt.model,
      latencyMs: stt.latencyMs,
    });

    const pauseMetrics = pauseMetricsFromSegments(stt.segments, stt.text || '');
    const segmentMetadata = {
      segments: stt.segments ?? [],
      sttModel: stt.model,
      sttLatencyMs: stt.latencyMs,
    };

    const userPrompt = `Transkript (Groq STT):\n${stt.text || '(bo‘sh yoki aniqlanmadi)'}\n\nPauza va vaqt statistikasi (JSON):\n${JSON.stringify(pauseMetrics, null, 2)}`;

    const { parsed: rawParsed, usage, latencyMs, model } = await this.groq.chatJson<Record<string, unknown>>({
      system: SPEAKING_JSON_SYSTEM,
      user: userPrompt,
      maxTokens: 2200,
      temperature: 0.28,
    });

    const parsed = normalizeSpeakingAiJson(rawParsed);

    await this.logUsage({
      userId,
      endpoint: 'ai.speaking.llm',
      model,
      inputTokens: usage.input,
      outputTokens: usage.output,
      latencyMs,
    });

    const record = await this.prisma.speakingRecord.create({
      data: {
        userId,
        audioStorageKey,
        transcript: stt.text || '',
        sttProvider: 'groq-whisper',
        pauseMetrics: pauseMetrics as object,
        segmentMetadata: segmentMetadata as object,
        fluencyScore: parsed.fluencyScore,
        grammarScore: parsed.grammarScore,
        pronunciationScore: parsed.pronunciationScore,
        overallScore: parsed.overallScore,
        estimatedSpeakingCefr: parsed.estimatedSpeakingCEFR,
        pronunciationAnalysis: parsed.pronunciationAnalysis as object,
        fluencyAnalysis: parsed.fluencyAnalysis as object,
        feedback: parsed.feedbackUz,
      },
    });

    await this.prisma.aiReport.create({
      data: {
        userId,
        kind: 'SPEAKING',
        model,
        tokensUsed: (usage.input ?? 0) + (usage.output ?? 0),
        payload: {
          recordId: record.id,
          sttModel: stt.model,
          llmModel: model,
          overallScore: record.overallScore,
          estimatedSpeakingCefr: record.estimatedSpeakingCefr,
          pauseMetrics: JSON.parse(JSON.stringify(pauseMetrics)),
        },
      },
    });

    return record;
  }

  /**
   * Transkript bilan tahlil (STT yo‘q). Pauza metrikalari STT bo‘lmagani uchun
   * transkript-rejimida saqlanadi — bu soxta ball emas, cheklov aniq.
   */
  async analyzeSpeakingFromTranscriptOnly(userId: string, audioUrl: string | undefined, transcript: string) {
    const trimmed = transcript.trim();
    const words = trimmed.split(/\s+/).filter(Boolean).length;
    if (words < 8) {
      throw new BadRequestException('Transkript kamida 8 so‘z bo‘lsin');
    }

    const pauseMetrics = {
      source: 'transcript_only',
      noteUz:
        'Audio segmentlari yo‘q: pauza va WPM Whisper STT orqali aniqlanmaydi. Talaffuz va intonatsiya transkript asosida taxminiy baholanadi.',
      wordCount: words,
      longPausesOver1_5s: null,
      pausesOver0_5s: null,
      maxGapSec: null,
      totalSpeechSec: null,
      audioDurationSec: null,
      totalPauseSec: null,
      speechRatioApprox: null,
      wordsPerMinuteApprox: null,
    };

    const userPrompt = `Transkript (faqat matn, audio yo‘q):\n${trimmed}\n\nKontekst (JSON):\n${JSON.stringify(pauseMetrics, null, 2)}`;

    const { parsed: rawParsed, usage, latencyMs, model } = await this.groq.chatJson<Record<string, unknown>>({
      system: SPEAKING_JSON_SYSTEM,
      user: userPrompt,
      maxTokens: 2000,
      temperature: 0.28,
    });

    const parsed = normalizeSpeakingAiJson(rawParsed);

    await this.logUsage({
      userId,
      endpoint: 'ai.speaking.transcript_only',
      model,
      inputTokens: usage.input,
      outputTokens: usage.output,
      latencyMs,
    });

    const record = await this.prisma.speakingRecord.create({
      data: {
        userId,
        audioUrl: audioUrl || null,
        transcript: trimmed,
        sttProvider: 'client_transcript',
        pauseMetrics: pauseMetrics as object,
        segmentMetadata: { mode: 'transcript_only' } as object,
        fluencyScore: parsed.fluencyScore,
        grammarScore: parsed.grammarScore,
        pronunciationScore: parsed.pronunciationScore,
        overallScore: parsed.overallScore,
        estimatedSpeakingCefr: parsed.estimatedSpeakingCEFR,
        pronunciationAnalysis: parsed.pronunciationAnalysis as object,
        fluencyAnalysis: parsed.fluencyAnalysis as object,
        feedback: parsed.feedbackUz,
      },
    });

    await this.prisma.aiReport.create({
      data: {
        userId,
        kind: 'SPEAKING',
        model,
        tokensUsed: (usage.input ?? 0) + (usage.output ?? 0),
        payload: { recordId: record.id, mode: 'transcript_only' },
      },
    });

    return record;
  }

  async generateRoadmap(userId: string) {
    const analytics = await this.prisma.analytics.findUnique({ where: { userId } });
    const results = await this.prisma.result.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 8,
      include: { exam: { select: { title: true, type: true } } },
    });

    const summary = {
      totalExams: analytics?.totalExams ?? 0,
      avgScore: analytics?.avgScore ?? 0,
      weakSkills: (analytics?.weakSkills as string[]) ?? [],
      recent: results.map((r) => ({ score: r.score, title: r.exam.title, type: r.exam.type })),
    };

    const system = `Foydalanuvchi ingliz tili mock natijalari asosida 7 kunlik reja tuz.
Faqat JSON: currentLevel (CEFR), targetLevel, weakSkills (string[]), studyPlan: [{day, task, duration}] — task matnlari o‘zbekcha bo‘lsin.`;

    const { parsed, usage, latencyMs, model } = await this.groq.chatJson<RoadmapAiJson>({
      system,
      user: `Ma'lumotlar:\n${JSON.stringify(summary, null, 2)}`,
      maxTokens: 2000,
      temperature: 0.35,
    });

    await this.logUsage({ userId, endpoint: 'ai.roadmap', model, inputTokens: usage.input, outputTokens: usage.output, latencyMs });

    return {
      ...parsed,
      totalExams: analytics?.totalExams || 0,
      avgScore: analytics?.avgScore || 0,
    };
  }

  async ceFrPrediction(userId: string | undefined, text: string) {
    const system = `Berilgan matn asosida taxminiy CEFR darajasini aniqla. Faqat JSON: estimatedLevel (A1-C2), confidence (0-100), rationaleUz (o‘zbekcha, 2-3 jumla)`;
    const { parsed, usage, latencyMs, model } = await this.groq.chatJson<CefrPredictJson>({
      system,
      user: text.slice(0, 12000),
      maxTokens: 400,
      temperature: 0.2,
    });
    await this.logUsage({
      userId: userId ?? null,
      endpoint: 'ai.cefr-predict',
      model,
      inputTokens: usage.input,
      outputTokens: usage.output,
      latencyMs,
    });
    return parsed;
  }
}
