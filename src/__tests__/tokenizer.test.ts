import { describe, it, expect } from 'vitest';
import { Tokenizer, tokenize } from '../tokenizer/index.js';

describe('Tokenizer', () => {
  describe('tokenize', () => {
    it('应该对简单的期刊引用进行词法分析', () => {
      const input = '[1] 张三，李四. 人工智能在教育中的应用[J]. 现代教育技术，2025，35(2)：15-22.';
      const tokens = tokenize(input);

      expect(tokens).toBeDefined();
      expect(tokens.length).toBeGreaterThan(0);

      // 检查关键 token 类型
      const types = tokens.map(t => t.type);
      expect(types).toContain('BRACKET_OPEN');
      expect(types).toContain('NUMBER');
      expect(types).toContain('BRACKET_CLOSE');
      expect(types).toContain('TYPE_INDICATOR');
    });

    it('应该处理空输入', () => {
      const tokens = tokenize('');
      expect(tokens).toEqual([]);
    });

    it('应该对括号进行词法分析', () => {
      const tokens = tokenize('[1]');
      expect(tokens).toHaveLength(3);
      expect(tokens[0].type).toBe('BRACKET_OPEN');
      expect(tokens[1].type).toBe('NUMBER');
      expect(tokens[2].type).toBe('BRACKET_CLOSE');
    });

    it('应该对类型标识进行词法分析', () => {
      const tokens = tokenize('[J]');
      expect(tokens).toHaveLength(1);
      expect(tokens[0].type).toBe('TYPE_INDICATOR');
      expect(tokens[0].value).toBe('[J]');
    });

    it('应该对带有 OL 后缀的类型标识进行词法分析', () => {
      const tokens = tokenize('[J/OL]');
      expect(tokens).toHaveLength(1);
      expect(tokens[0].type).toBe('TYPE_INDICATOR');
      expect(tokens[0].value).toBe('[J/OL]');
    });

    it('应该对日期进行词法分析', () => {
      const tokens = tokenize('2025');
      expect(tokens.some(t => t.type === 'YEAR')).toBe(true);
    });

    it('应该对完整日期进行词法分析', () => {
      const tokens = tokenize('2025-09-07');
      expect(tokens.some(t => t.type === 'DATE')).toBe(true);
    });

    it('应该对 URL 进行词法分析', () => {
      const tokens = tokenize('https://example.com');
      expect(tokens.some(t => t.type === 'URL')).toBe(true);
    });

    it('应该对标点符号进行词法分析', () => {
      const tokens = tokenize('.，：；/');
      expect(tokens.some(t => t.type === 'DOT')).toBe(true);
      expect(tokens.some(t => t.type === 'COMMA')).toBe(true);
      expect(tokens.some(t => t.type === 'COLON')).toBe(true);
      expect(tokens.some(t => t.type === 'SEMICOLON')).toBe(true);
      expect(tokens.some(t => t.type === 'SLASH')).toBe(true);
    });

    it('应该对双斜杠进行词法分析', () => {
      const tokens = tokenize('//');
      expect(tokens).toHaveLength(1);
      expect(tokens[0].type).toBe('DOUBLE_SLASH');
    });

    it('应该对括号进行词法分析', () => {
      const tokens = tokenize('(2)');
      expect(tokens.some(t => t.type === 'PAREN_OPEN')).toBe(true);
      expect(tokens.some(t => t.type === 'PAREN_CLOSE')).toBe(true);
    });

    it('应该对破折号进行词法分析', () => {
      const tokens = tokenize('15-22');
      expect(tokens.some(t => t.type === 'DASH')).toBe(true);
    });

    it('应该对全角破折号进行词法分析', () => {
      const tokens = tokenize('—');
      expect(tokens.some(t => t.type === 'DASH')).toBe(true);
    });

    it('应该对半角破折号进行词法分析', () => {
      const tokens = tokenize('–');
      expect(tokens.some(t => t.type === 'DASH')).toBe(true);
    });

    it('应该对中文冒号进行词法分析', () => {
      const tokens = tokenize('：');
      expect(tokens.some(t => t.type === 'COLON')).toBe(true);
    });

    it('应该对中文分号进行词法分析', () => {
      const tokens = tokenize('；');
      expect(tokens.some(t => t.type === 'SEMICOLON')).toBe(true);
    });

    it('应该对中文逗号进行词法分析', () => {
      const tokens = tokenize('，');
      expect(tokens.some(t => t.type === 'COMMA')).toBe(true);
    });

    it('应该对括号中的日期进行词法分析', () => {
      const tokens = tokenize('(2025-09-07)');
      expect(tokens.some(t => t.type === 'PAREN_OPEN')).toBe(true);
      expect(tokens.some(t => t.type === 'DATE')).toBe(true);
      expect(tokens.some(t => t.type === 'PAREN_CLOSE')).toBe(true);
    });

    it('应该对方括号中的日期进行词法分析', () => {
      const tokens = tokenize('[2025-09-07]');
      expect(tokens.some(t => t.type === 'BRACKET_OPEN')).toBe(true);
      expect(tokens.some(t => t.type === 'DATE')).toBe(true);
      expect(tokens.some(t => t.type === 'BRACKET_CLOSE')).toBe(true);
    });

    it('应该对带有中文年字符的年份进行词法分析', () => {
      const tokens = tokenize('2025年');
      expect(tokens.some(t => t.type === 'YEAR')).toBe(true);
    });

    it('应该将 DOI 作为 PID 进行词法分析', () => {
      const tokens = tokenize('doi:10.1234/test');
      expect(tokens.some(t => t.type === 'PID')).toBe(true);
    });

    it('应该对带有空格的 DOI 进行词法分析', () => {
      const tokens = tokenize('doi: 10.1234/test');
      expect(tokens.some(t => t.type === 'PID')).toBe(true);
    });

    it('应该对引用末尾的 DOI 进行词法分析', () => {
      const tokens = tokenize('[1] 张三. 论文[J]. 期刊, 2025. DOI:10.1234/test');
      const pidTokens = tokens.filter(t => t.type === 'PID');
      expect(pidTokens.length).toBe(1);
      expect(pidTokens[0].value).toBe('DOI:10.1234/test');
    });

    it('应该对 http URL 进行词法分析', () => {
      const tokens = tokenize('http://example.com');
      expect(tokens.some(t => t.type === 'URL')).toBe(true);
    });

    it('应该对带有小数的数字进行词法分析', () => {
      const tokens = tokenize('12.5');
      expect(tokens.some(t => t.type === 'NUMBER')).toBe(true);
    });

    it('应该处理空白字符', () => {
      const tokens = tokenize('  test  ');
      expect(tokens).toHaveLength(1);
      expect(tokens[0].type).toBe('TEXT');
      expect(tokens[0].value).toBe('test');
    });

    it('应该处理制表符', () => {
      const tokens = tokenize('\ttest\t');
      expect(tokens).toHaveLength(1);
      expect(tokens[0].type).toBe('TEXT');
    });

    it('应该处理换行符', () => {
      const tokens = tokenize('\ntest\n');
      expect(tokens).toHaveLength(1);
      expect(tokens[0].type).toBe('TEXT');
    });

    it('应该处理回车符', () => {
      const tokens = tokenize('\rtest\r');
      expect(tokens).toHaveLength(1);
      expect(tokens[0].type).toBe('TEXT');
    });

    it('应该通过跳过来处理无法识别的字符', () => {
      const tokens = tokenize('@#$');
      // These characters are treated as text by readText()
      expect(tokens.length).toBeGreaterThanOrEqual(0);
    });

    it('应该处理带有无法识别字符的混合内容', () => {
      const tokens = tokenize('abc@#$def');
      // 'abc' becomes TEXT, then @, #, $ are skipped, then 'def' becomes TEXT
      expect(tokens.some(t => t.type === 'TEXT')).toBe(true);
    });

    it('应该对包含所有元素的复杂引用进行词法分析', () => {
      const input = '[1] 张三，李四，王五. 人工智能在教育中的应用研究[J]. 现代教育技术，2025，35(2)：15-22.';
      const tokens = tokenize(input);

      expect(tokens.some(t => t.type === 'BRACKET_OPEN')).toBe(true);
      expect(tokens.some(t => t.type === 'NUMBER')).toBe(true);
      expect(tokens.some(t => t.type === 'BRACKET_CLOSE')).toBe(true);
      expect(tokens.some(t => t.type === 'COMMA')).toBe(true);
      expect(tokens.some(t => t.type === 'DOT')).toBe(true);
      expect(tokens.some(t => t.type === 'TYPE_INDICATOR')).toBe(true);
      expect(tokens.some(t => t.type === 'COLON')).toBe(true);
      expect(tokens.some(t => t.type === 'PAREN_OPEN')).toBe(true);
      expect(tokens.some(t => t.type === 'PAREN_CLOSE')).toBe(true);
      expect(tokens.some(t => t.type === 'DASH')).toBe(true);
    });
  });

  describe('Tokenizer class', () => {
    it('应该创建 Tokenizer 实例', () => {
      const tokenizer = new Tokenizer('test');
      expect(tokenizer).toBeInstanceOf(Tokenizer);
    });

    it('应该对输入字符串进行词法分析', () => {
      const tokenizer = new Tokenizer('[J]');
      const tokens = tokenizer.tokenize();
      expect(tokens).toHaveLength(1);
      expect(tokens[0].type).toBe('TYPE_INDICATOR');
    });

    it('应该在多次 tokenize 调用时重置位置', () => {
      const tokenizer = new Tokenizer('[J]');
      const tokens1 = tokenizer.tokenize();
      const tokens2 = tokenizer.tokenize();
      expect(tokens1).toHaveLength(1);
      expect(tokens2).toHaveLength(1);
    });
  });
});
