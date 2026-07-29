import { describe, expect, it } from 'vitest';
import {
  hashEditorialContent,
  isEditoriallyIndexable,
  editorialSignatureSchemaMode,
  resolveArticleEditorialState,
} from '@/lib/editorial-signature';
import { blogPostSchema } from '@/lib/schemas/blog';
import type { Post } from '@/data/blog/types';

const base = {
  body: '<p>Contenido publicado revisado por el despacho.</p>',
  author: 'Pineda y Asociados',
  published: true,
};

describe('firma editorial vinculada a versión', () => {
  it('separa explícitamente modo legacy y modo migrado', () => {
    expect(editorialSignatureSchemaMode({ EDITORIAL_SIGNATURE_SCHEMA_READY: 'false' }))
      .toBe('LEGACY_INSTITUTIONAL_MODE');
    expect(editorialSignatureSchemaMode({ EDITORIAL_SIGNATURE_SCHEMA_READY: 'true' }))
      .toBe('MIGRATED_SIGNATURE_MODE');
  });

  it('trata el artículo histórico publicado como revisado institucionalmente', () => {
    const state = resolveArticleEditorialState({ ...base, reviewStatus: 'pending' });
    expect(state.publicationState).toBe('published_firm_reviewed');
    expect(state.reviewOrigin).toBe('firm_historical_review');
    expect(state.signature).toMatchObject({ type: 'firm', name: 'Pineda y Asociados' });
    expect(state.signatureValid).toBe(true);
    expect(isEditoriallyIndexable({ ...base, reviewStatus: 'pending' })).toBe(true);
  });

  it('no exige firma individual para indexar una firma institucional válida', () => {
    expect(isEditoriallyIndexable({ ...base, reviewedBy: null })).toBe(true);
  });

  it('no hereda firma a una propuesta nueva pendiente de nueva firma', () => {
    const state = resolveArticleEditorialState({
      ...base,
      body: '<p>Propuesta modificada.</p>',
      reviewStatus: 'pending_resignature',
      reviewedBy: 'Danilo Pineda Maradiaga',
    });
    expect(state.signature).toBeNull();
    expect(state.signatureValid).toBe(false);
    expect(isEditoriallyIndexable({
      ...base,
      body: '<p>Propuesta modificada.</p>',
      reviewStatus: 'pending_resignature',
    })).toBe(false);
  });

  it('invalida una firma cuyo hash no coincide con el cuerpo actual', () => {
    const state = resolveArticleEditorialState({
      ...base,
      reviewStatus: 'verified',
      reviewedBy: 'Danilo Pineda Maradiaga',
      reviewedContentHash: hashEditorialContent('<p>Versión anterior.</p>'),
    });
    expect(state.signatureValid).toBe(false);
    expect(isEditoriallyIndexable({
      ...base,
      reviewStatus: 'verified',
      reviewedBy: 'Danilo Pineda Maradiaga',
      reviewedContentHash: hashEditorialContent('<p>Versión anterior.</p>'),
    })).toBe(false);
  });

  it('en modo migrado rechaza firma sin hash persistido aunque el artículo esté publicado', () => {
    const state = resolveArticleEditorialState(
      {
        ...base,
        reviewStatus: 'published_firm_reviewed',
        reviewOrigin: 'firm_historical_review',
        signatureType: 'firm',
        signatureName: 'Pineda y Asociados',
        signatureValid: true,
      },
      'MIGRATED_SIGNATURE_MODE',
    );
    expect(state.signatureValid).toBe(false);
  });

  it('en modo migrado exige flag, contrato canónico y hash coincidente', () => {
    const reviewedContentHash = hashEditorialContent(base.body);
    const valid = {
      ...base,
      reviewStatus: 'published_firm_reviewed',
      reviewOrigin: 'firm_historical_review',
      signatureType: 'firm',
      signatureName: 'Pineda y Asociados',
      signatureValid: true,
      reviewedContentHash,
    };
    expect(isEditoriallyIndexable(valid, 'MIGRATED_SIGNATURE_MODE')).toBe(true);
    expect(isEditoriallyIndexable({ ...valid, signatureValid: false }, 'MIGRATED_SIGNATURE_MODE')).toBe(false);
    expect(isEditoriallyIndexable({ ...valid, body: '<p>Drift.</p>' }, 'MIGRATED_SIGNATURE_MODE')).toBe(false);
    expect(isEditoriallyIndexable({ ...valid, signatureName: 'No canónico' }, 'MIGRATED_SIGNATURE_MODE')).toBe(false);
  });

  it('no muestra un abogado individual sin confirmación verificable', () => {
    const state = resolveArticleEditorialState({
      ...base,
      reviewStatus: 'published',
      reviewedBy: 'Danilo Pineda Maradiaga',
    });
    expect(state.signature?.type).toBe('firm');
    expect(state.signature?.name).toBe('Pineda y Asociados');
  });

  it('emite reviewedBy Organization para firma institucional real', () => {
    const post: Post = {
      slug: 'institucional',
      title: 'Artículo',
      description: 'Descripción',
      body: base.body,
      publishedAt: '2026-01-01T00:00:00.000Z',
      category: 'derecho-penal',
      tags: [],
      author: 'Pineda y Asociados',
      readingTime: '3 min',
      reviewStatus: 'published',
    };
    expect(blogPostSchema(post).reviewedBy).toMatchObject({
      '@type': 'Organization',
      name: 'Pineda y Asociados',
    });
  });
});
