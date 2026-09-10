import { describe, it, expect } from 'vitest';
import { Formatter, formatCitation } from '../../formatter/index.js';
import type { ReferenceUnion } from '../../types/index.js';
import { ReferenceType } from '../../types/index.js';

describe('formatCitation', () => {
  it('应该格式化数字引用', () => {
    const reference: ReferenceUnion = {
      type: ReferenceType.J,
      id: '5',
      authors: [{ name: '张三' }],
      title: '论文标题',
      journalTitle: '期刊名',
      year: '2025',
    };
    expect(formatCitation(reference)).toBe('[5]');
  });

  it('应该格式化没有 id 的数字引用', () => {
    const reference: ReferenceUnion = {
      type: ReferenceType.J,
      authors: [{ name: '张三' }],
      title: '论文标题',
      journalTitle: '期刊名',
      year: '2025',
    };
    expect(formatCitation(reference)).toBe('');
  });

  it('应该格式化作者-年份引用', () => {
    const reference: ReferenceUnion = {
      type: ReferenceType.J,
      authors: [{ name: '张三' }],
      title: '论文标题',
      journalTitle: '期刊名',
      year: '2025',
    };
    const result = formatCitation(reference, { citationStyle: 'author-date' });
    expect(result).toBe('(张三, 2025)');
  });

  it('应该格式化带有多个作者的作者-年份引用', () => {
    const reference: ReferenceUnion = {
      type: ReferenceType.J,
      authors: [
        { name: '张三' },
        { name: '李四' },
        { name: '王五' },
      ],
      title: '论文标题',
      journalTitle: '期刊名',
      year: '2025',
    };
    const result = formatCitation(reference, { citationStyle: 'author-date' });
    expect(result).toBe('(张三, 等, 2025)');
  });

  it('应该格式化英文的作者-年份引用', () => {
    const reference: ReferenceUnion = {
      type: ReferenceType.J,
      authors: [
        { name: 'Smith' },
        { name: 'Johnson' },
      ],
      title: 'Paper Title',
      journalTitle: 'Journal Name',
      year: '2025',
    };
    const result = formatCitation(reference, { citationStyle: 'author-date', locale: 'en' });
    expect(result).toBe('(Smith, et al., 2025)');
  });

  it('应该格式化单个作者的作者-年份引用', () => {
    const reference: ReferenceUnion = {
      type: ReferenceType.J,
      authors: [{ name: 'Smith' }],
      title: 'Paper Title',
      journalTitle: 'Journal Name',
      year: '2025',
    };
    const result = formatCitation(reference, { citationStyle: 'author-date', locale: 'en' });
    expect(result).toBe('(Smith, 2025)');
  });

  it('应该格式化没有年份的作者-年份引用', () => {
    const reference: ReferenceUnion = {
      type: ReferenceType.J,
      authors: [{ name: '张三' }],
      title: '论文标题',
      journalTitle: '期刊名',
      year: '',
    };
    const result = formatCitation(reference, { citationStyle: 'author-date' });
    expect(result).toBe('');
  });

  it('应该格式化没有作者的作者-年份引用', () => {
    const reference: ReferenceUnion = {
      type: ReferenceType.J,
      authors: [],
      title: '论文标题',
      journalTitle: '期刊名',
      year: '2025',
    };
    const result = formatCitation(reference, { citationStyle: 'author-date' });
    expect(result).toBe('(2025)');
  });
});

describe('footnote citation', () => {
  it('应该使用带圈数字格式化脚注引用', () => {
    const reference: ReferenceUnion = {
      id: '1',
      type: ReferenceType.J,
      authors: [{ name: '张三' }],
      title: '论文标题',
      journalTitle: '期刊名',
      year: '2025',
    };
    const result = formatCitation(reference, { citationStyle: 'footnote' });
    expect(result).toBe('①');
  });

  it('应该格式化编号大于 10 的脚注引用', () => {
    const reference: ReferenceUnion = {
      id: '11',
      type: ReferenceType.J,
      authors: [{ name: '张三' }],
      title: '论文标题',
      journalTitle: '期刊名',
      year: '2025',
    };
    const result = formatCitation(reference, { citationStyle: 'footnote' });
    expect(result).toBe('⑪');
  });

  it('当 id 缺失时应该返回空字符串', () => {
    const reference: ReferenceUnion = {
      type: ReferenceType.J,
      authors: [{ name: '张三' }],
      title: '论文标题',
      journalTitle: '期刊名',
      year: '2025',
    };
    const result = formatCitation(reference, { citationStyle: 'footnote' });
    expect(result).toBe('');
  });
});

describe('sortReferences', () => {
  it('应该按语言组排序引用', () => {
    const references: ReferenceUnion[] = [
      {
        type: ReferenceType.J,
        authors: [{ name: 'Smith' }],
        title: 'English Paper',
        journalTitle: 'Journal',
        year: '2025',
      },
      {
        type: ReferenceType.J,
        authors: [{ name: '张三' }],
        title: '中文论文',
        journalTitle: '期刊名',
        year: '2024',
      },
      {
        type: ReferenceType.J,
        authors: [{ name: 'Иванов' }],
        title: 'Русская статья',
        journalTitle: 'Журнал',
        year: '2023',
      },
    ];
    const formatter = new Formatter();
    const sorted = formatter.sortReferences(references);
    // Order: zh, western, ru
    expect(sorted[0]!.authors[0]!.name).toBe('张三');
    expect(sorted[1]!.authors[0]!.name).toBe('Smith');
    expect(sorted[2]!.authors[0]!.name).toBe('Иванов');
  });

  it('应该在相同语言内按作者姓名排序引用', () => {
    const references: ReferenceUnion[] = [
      {
        type: ReferenceType.J,
        authors: [{ name: 'Zhang' }],
        title: 'Paper C',
        journalTitle: 'Journal',
        year: '2025',
      },
      {
        type: ReferenceType.J,
        authors: [{ name: 'Li' }],
        title: 'Paper A',
        journalTitle: 'Journal',
        year: '2025',
      },
      {
        type: ReferenceType.J,
        authors: [{ name: 'Wang' }],
        title: 'Paper B',
        journalTitle: 'Journal',
        year: '2025',
      },
    ];
    const formatter = new Formatter();
    const sorted = formatter.sortReferences(references);
    expect(sorted[0]!.authors[0]!.name).toBe('Li');
    expect(sorted[1]!.authors[0]!.name).toBe('Wang');
    expect(sorted[2]!.authors[0]!.name).toBe('Zhang');
  });

  it('应该在相同作者内按年份排序引用', () => {
    const references: ReferenceUnion[] = [
      {
        type: ReferenceType.J,
        authors: [{ name: '张三' }],
        title: '论文2025',
        journalTitle: '期刊',
        year: '2025',
      },
      {
        type: ReferenceType.J,
        authors: [{ name: '张三' }],
        title: '论文2023',
        journalTitle: '期刊',
        year: '2023',
      },
      {
        type: ReferenceType.J,
        authors: [{ name: '张三' }],
        title: '论文2024',
        journalTitle: '期刊',
        year: '2024',
      },
    ];
    const formatter = new Formatter();
    const sorted = formatter.sortReferences(references);
    expect(sorted[0]!.year).toBe('2023');
    expect(sorted[1]!.year).toBe('2024');
    expect(sorted[2]!.year).toBe('2025');
  });
});
