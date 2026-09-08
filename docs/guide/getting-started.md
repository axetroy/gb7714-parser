# 快速开始

## 安装

```bash
npm install gb7714-parser
```

## 基本用法

### 解析参考文献

```typescript
import { parse } from 'gb7714-parser';

const result = parse(
  '[1] 张三，李四. 人工智能在教育中的应用[J]. 现代教育技术，2025，35(2)：15-22.'
);

console.log(result.reference);
// {
//   type: 'J',
//   authors: [{ surname: '张三' }, { surname: '李四' }],
//   title: '人工智能在教育中的应用',
//   journalTitle: '现代教育技术',
//   year: '2025',
//   volume: '35',
//   issue: '2',
//   pages: '15-22'
// }
```

### 校验格式

```typescript
import { parse, validate } from 'gb7714-parser';

const result = parse('[1] 张三. 论文标题[J]. 期刊名，2025，1：1-10.');
const report = validate(result.reference);

console.log(report.valid); // true
console.log(report.errors); // []
```

### 格式化输出

```typescript
import { parse, format } from 'gb7714-parser';

const result = parse('[1] 张三. 论文标题[J]. 期刊名，2025，1：1-10.');
const formatted = format(result.reference);

console.log(formatted);
// 张三 论文标题[J]. 期刊名, 2025, 1: 1-10.
```

### 批量解析

```typescript
import { parseAll } from 'gb7714-parser';

const inputs = [
  '[1] 张三. 论文1[J]. 期刊1，2025，1：1-10.',
  '[2] 李四. 书1[M]. 北京: 出版社, 2024.',
];

const results = parseAll(inputs);
console.log(results.length); // 2
```

### 解析引用标注

```typescript
import { parseCitation } from 'gb7714-parser';

// 顺序编码制
const result1 = parseCitation('[1]');
console.log(result1.type); // 'numeric'
console.log(result1.ids); // ['1']

const result2 = parseCitation('[1,2,3]');
console.log(result2.ids); // ['1', '2', '3']

const result3 = parseCitation('[1-5]');
console.log(result3.ids); // ['1', '2', '3', '4', '5']

// 著者-出版年制
const result4 = parseCitation('(张三, 2025)');
console.log(result4.type); // 'author-date'
console.log(result4.author); // '张三'
console.log(result4.year); // '2025'
```

## 下一步

- 查看 [API 参考](/api/) 了解详细用法
- 访问 [Playground](/playground/) 在线体验
