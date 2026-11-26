import { describe, expect, it } from 'vitest';
import { countPlanItems } from './plan-import';

describe('countPlanItems', () => {
  it('compte les aliments d’une enveloppe plan-aliments et renvoie le JSON tel quel', () => {
    const text = JSON.stringify({
      kind: 'plan-aliments',
      schemaVersion: 1,
      aliments: [{ name: 'Riz' }, { name: 'Poulet' }],
    });

    const result = countPlanItems(text, 'aliments');

    expect(result).toEqual({ ok: true, count: 2, content: JSON.parse(text) });
  });

  it('accepte un tableau brut de recettes', () => {
    const result = countPlanItems(JSON.stringify([{ name: 'Salade' }]), 'recettes');

    expect(result).toEqual({ ok: true, count: 1, content: [{ name: 'Salade' }] });
  });

  it('signale un JSON mal formé', () => {
    const result = countPlanItems('{ "aliments": ', 'aliments');

    expect(result).toEqual({
      ok: false,
      message: 'le contenu n’est pas du JSON valide',
    });
  });

  it('signale une liste absente de l’enveloppe, par exemple une liste de recettes dans un fichier d’aliments', () => {
    const result = countPlanItems(JSON.stringify({ recettes: [{ name: 'Salade' }] }), 'aliments');

    expect(result).toEqual({
      ok: false,
      message: 'la liste « aliments » est absente du fichier',
    });
  });

  it('signale une liste vide', () => {
    const result = countPlanItems(JSON.stringify({ aliments: [] }), 'aliments');

    expect(result).toEqual({ ok: false, message: 'le fichier ne contient aucun élément' });
  });

  it('refuse un contenu qui n’est ni un objet ni un tableau', () => {
    const result = countPlanItems('"texte"', 'recettes');

    expect(result.ok).toBe(false);
  });
});
