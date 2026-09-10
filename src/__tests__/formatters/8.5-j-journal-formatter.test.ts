import { describe, it, expect } from 'vitest';
import { JournalFormatter } from '../../formatter/types/8.5-j-journal-formatter.js';
import type { Journal } from '../../types/index.js';
import { ReferenceType } from '../../types/index.js';

describe('JournalFormatter', () => {
  const formatter = new JournalFormatter({});

  describe('format', () => {
    it('应该格式化期刊引用', () => {
      const reference: Journal = {
        type: ReferenceType.J,
        authors: [{ name: '张三' }, { name: '李四' }],
        title: '人工智能在教育中的应用',
        journalTitle: '现代教育技术',
        year: '2025',
        volume: '35',
        issue: '2',
        pages: '15-22',
      };
      const result = formatter.format(reference);
      expect(result).toBe('张三, 李四 人工智能在教育中的应用[J]. 现代教育技术, 2025, 35(2): 15-22.');
    });

    it('应该格式化没有卷号/期号的期刊', () => {
      const reference: Journal = {
        type: ReferenceType.J,
        authors: [{ name: '张三' }],
        title: '论文标题',
        journalTitle: '期刊名',
        year: '2025',
      };
      const result = formatter.format(reference);
      expect(result).toBe('张三 论文标题[J]. 期刊名, 2025.');
    });

    it('应该对超过 3 个作者使用 "等"', () => {
      const reference: Journal = {
        type: ReferenceType.J,
        authors: [
          { name: '张三' },
          { name: '李四' },
          { name: '王五' },
          { name: '赵六' },
        ],
        title: '论文标题',
        journalTitle: '期刊名',
        year: '2025',
      };
      const result = formatter.format(reference);
      expect(result).toBe('张三, 李四, 王五, 等 论文标题[J]. 期刊名, 2025.');
    });

    it('应该格式化机构作为作者', () => {
      const reference: Journal = {
        type: ReferenceType.J,
        authors: [{ name: '中国科学院', isOrganization: true }],
        title: '研究报告',
        journalTitle: '科学通报',
        year: '2025',
      };
      const result = formatter.format(reference);
      expect(result).toBe('中国科学院 研究报告[J]. 科学通报, 2025.');
    });

    it('应该格式化带有完整姓名的作者', () => {
      const reference: Journal = {
        type: ReferenceType.J,
        authors: [{ name: 'Smith John' }],
        title: 'Paper Title',
        journalTitle: 'Journal Name',
        year: '2025',
      };
      const result = formatter.format(reference);
      expect(result).toBe('Smith John Paper Title[J]. Journal Name, 2025.');
    });

    it('应该格式化带有 id 的期刊', () => {
      const reference: Journal = {
        type: ReferenceType.J,
        id: '1',
        authors: [{ name: '张三' }],
        title: '论文标题',
        journalTitle: '期刊名',
        year: '2025',
      };
      const result = formatter.format(reference);
      expect(result).toBe('[1] 张三 论文标题[J]. 期刊名, 2025.');
    });

    it('应该格式化带有 pid 的期刊', () => {
      const reference: Journal = {
        type: ReferenceType.J,
        authors: [{ name: '张三' }],
        title: '论文标题',
        journalTitle: '期刊名',
        year: '2025',
        pid: '10.1234/test',
      };
      const result = formatter.format(reference);
      expect(result).toBe('张三 论文标题[J]. 期刊名, 2025. PID:10.1234/test');
    });

    it('应该格式化带有 URL 的期刊', () => {
      const reference: Journal = {
        type: ReferenceType.J,
        authors: [{ name: '张三' }],
        title: '论文标题',
        journalTitle: '期刊名',
        year: '2025',
        url: 'https://example.com',
      };
      const result = formatter.format(reference);
      expect(result).toBe('张三 论文标题[J]. 期刊名, 2025. https://example.com');
    });

    it('应该在 2015 版本中使用 DOI', () => {
      const formatter2015 = new JournalFormatter({ version: '2015' });
      const reference: Journal = {
        type: ReferenceType.J,
        authors: [{ name: '张三' }],
        title: '论文标题',
        journalTitle: '期刊名',
        year: '2025',
        pid: '10.1234/test',
      };
      const result = formatter2015.format(reference);
      expect(result).toBe('张三 论文标题[J]. 期刊名, 2025. DOI:10.1234/test');
    });

    it('应该在 2025 版本中使用 PID', () => {
      const formatter2025 = new JournalFormatter({ version: '2025' });
      const reference: Journal = {
        type: ReferenceType.J,
        authors: [{ name: '张三' }],
        title: '论文标题',
        journalTitle: '期刊名',
        year: '2025',
        pid: '10.1234/test',
      };
      const result = formatter2025.format(reference);
      expect(result).toBe('张三 论文标题[J]. 期刊名, 2025. PID:10.1234/test');
    });

    it('应该格式化带有副标题的期刊', () => {
      const reference: Journal = {
        type: ReferenceType.J,
        authors: [{ name: '张三' }],
        title: '人工智能研究',
        subtitle: '综述篇',
        journalTitle: '计算机学报',
        year: '2025',
        volume: '48',
        issue: '1',
      };
      const result = formatter.format(reference);
      expect(result).toBe('张三 人工智能研究: 综述篇[J]. 计算机学报, 2025, 48(1).');
    });

    it('应该使用中文区域设置默认使用 "等"', () => {
      const formatterZh = new JournalFormatter({ locale: 'zh' });
      const reference: Journal = {
        type: ReferenceType.J,
        authors: [
          { name: '张三' },
          { name: '李四' },
          { name: '王五' },
          { name: '赵六' },
        ],
        title: '论文标题',
        journalTitle: '期刊名',
        year: '2025',
      };
      const result = formatterZh.format(reference);
      expect(result).toContain('等');
      expect(result).not.toContain('et al.');
    });

    it('应该使用英文区域设置使用 "et al."', () => {
      const formatterEn = new JournalFormatter({ locale: 'en' });
      const reference: Journal = {
        type: ReferenceType.J,
        authors: [
          { name: 'Smith' },
          { name: 'Johnson' },
          { name: 'Williams' },
          { name: 'Brown' },
        ],
        title: 'Paper Title',
        journalTitle: 'Journal Name',
        year: '2025',
      };
      const result = formatterEn.format(reference);
      expect(result).toContain('et al.');
      expect(result).not.toContain('等');
    });

    describe('author-date style', () => {
      it('应该在作者-年份样式中将年份放在作者之后格式化期刊', () => {
        const formatter = new JournalFormatter({ citationStyle: 'author-date' });
        const reference: Journal = {
          type: ReferenceType.J,
          authors: [{ name: '张三' }],
          title: '论文标题',
          journalTitle: '期刊名',
          year: '2025',
          volume: '35',
          issue: '2',
          pages: '15-22',
        };
        const result = formatter.format(reference);
        expect(result).toBe('张三, 2025. 论文标题[J]. 期刊名, 35(2): 15-22.');
      });

      it('应该在作者-年份样式中格式化带有多个作者的期刊', () => {
        const formatter = new JournalFormatter({ citationStyle: 'author-date' });
        const reference: Journal = {
          type: ReferenceType.J,
          authors: [
            { name: '张三' },
            { name: '李四' },
            { name: '王五' },
            { name: '赵六' },
          ],
          title: '论文标题',
          journalTitle: '期刊名',
          year: '2025',
          volume: '10',
          issue: '1',
        };
        const result = formatter.format(reference);
        // 参考文献表: 前3个 + "等" (§7.1.2)
        expect(result).toBe('张三, 李四, 王五, 等, 2025. 论文标题[J]. 期刊名, 10(1).');
      });

      it('应该在作者-年份样式中格式化没有卷号/期号的期刊', () => {
        const formatter = new JournalFormatter({ citationStyle: 'author-date' });
        const reference: Journal = {
          type: ReferenceType.J,
          authors: [{ name: '张三' }],
          title: '论文标题',
          journalTitle: '期刊名',
          year: '2025',
        };
        const result = formatter.format(reference);
        expect(result).toBe('张三, 2025. 论文标题[J]. 期刊名.');
      });
    });
  });
});
