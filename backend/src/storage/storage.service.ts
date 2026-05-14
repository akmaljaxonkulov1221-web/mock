import { Injectable, BadRequestException, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import { randomUUID } from 'crypto';

const ALLOWED_IMAGE = new Map<number[], string>([
  [[0xff, 0xd8, 0xff], 'image/jpeg'],
  [[0x89, 0x50, 0x4e, 0x47], 'image/png'],
  [[0x52, 0x49, 0x46, 0x46], 'image/webp'], // RIFF....WEBP checked loosely below
]);

function sniffImageMime(buf: Buffer): string | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'image/png';
  if (buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
  return null;
}

const ALLOWED_AUDIO = new Set(['audio/webm', 'audio/wav', 'audio/wave', 'audio/x-wav', 'audio/mpeg', 'audio/mp3']);

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly root = process.env.UPLOAD_ROOT || path.join(process.cwd(), 'uploads');

  async onModuleInit() {
    await fs.mkdir(path.join(this.root, 'payments'), { recursive: true });
    await fs.mkdir(path.join(this.root, 'speaking'), { recursive: true });
    await fs.mkdir(path.join(this.root, 'writing'), { recursive: true });
  }

  /** Public URL path (served by Nest static). */
  toPublicUrl(storageKey: string) {
    const base = process.env.PUBLIC_UPLOAD_URL_PREFIX || '/uploads';
    return `${base.replace(/\/$/, '')}/${storageKey.replace(/^\//, '')}`;
  }

  async savePaymentProof(buffer: Buffer, declaredMime: string): Promise<{ storageKey: string; publicUrl: string }> {
    const max = Number(process.env.MAX_PAYMENT_IMAGE_BYTES) || 5 * 1024 * 1024;
    if (buffer.length > max) throw new BadRequestException('Rasm juda katta');
    const mime = sniffImageMime(buffer);
    if (!mime) throw new BadRequestException('Faqat JPEG, PNG yoki WEBP yuklash mumkin');
    if (declaredMime && !declaredMime.startsWith('image/')) {
      throw new BadRequestException('Noto‘g‘ri fayl turi');
    }
    const ext = mime === 'image/jpeg' ? 'jpg' : mime === 'image/png' ? 'png' : 'webp';
    const storageKey = `payments/${randomUUID()}.${ext}`;
    const full = path.join(this.root, storageKey);
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, buffer);
    return { storageKey, publicUrl: this.toPublicUrl(storageKey) };
  }

  async saveSpeakingAudio(buffer: Buffer, mimeType: string, originalName: string): Promise<{ storageKey: string; publicUrl: string }> {
    const max = Number(process.env.MAX_SPEAKING_AUDIO_BYTES) || 20 * 1024 * 1024;
    if (buffer.length > max) throw new BadRequestException('Audio juda katta');
    if (!ALLOWED_AUDIO.has(mimeType)) throw new BadRequestException('Qo‘llab-quvvatlanadigan audio: webm, wav, mp3');
    const ext =
      mimeType.includes('webm') ? 'webm' : mimeType.includes('mpeg') || mimeType.includes('mp3') ? 'mp3' : 'wav';
    const safe = (originalName || 'rec').replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);
    const storageKey = `speaking/${randomUUID()}-${safe}.${ext}`;
    const full = path.join(this.root, storageKey);
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, buffer);
    return { storageKey, publicUrl: this.toPublicUrl(storageKey) };
  }

  getAbsolutePath(storageKey: string) {
    return path.join(this.root, storageKey);
  }
}
