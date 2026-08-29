import { describe, it, expect } from 'vitest';
import {
  hasLawyerNotebookShortcut,
  stripLawyerNotebookShortcut,
} from '../lib/chat/lawyer-shortcut';

describe('lawyer notebook shortcut', () => {
  it('requiere «una pregunta:» al inicio', () => {
    expect(hasLawyerNotebookShortcut('una pregunta: poderes desde España')).toBe(true);
    expect(hasLawyerNotebookShortcut('Una pregunta: ¿necesito notario?')).toBe(true);
    expect(hasLawyerNotebookShortcut('  una pregunta: trámite de censo')).toBe(true);
    expect(hasLawyerNotebookShortcut('una pregunta ¿necesito notario?')).toBe(false);
    expect(hasLawyerNotebookShortcut('tengo una pregunta: sobre poderes')).toBe(false);
  });

  it('elimina el prefijo y conserva la consulta', () => {
    expect(stripLawyerNotebookShortcut('una pregunta: poderes desde España')).toBe(
      'poderes desde España',
    );
    expect(stripLawyerNotebookShortcut('Una pregunta: ¿necesito notario?')).toBe(
      '¿necesito notario?',
    );
  });
});
