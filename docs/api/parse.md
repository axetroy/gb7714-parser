# parse

解析单条参考文献字符串。

## 函数签名

```typescript
function parse<T extends ReferenceUnion = ReferenceUnion>(
  input: string,
  options?: ParseOptions
): ParseResult<T>
```

## 参数

### input

- 类型: `string`
- 必填: 是

要解析的参考文献字符串。

### options

- 类型: `ParseOptions`
- 必填: 否

解析选项。

```typescript
interface ParseOptions {
  version?: '2015' | '2025';  // 标准版本，默认 '2025'
  strict?: boolean;           // 严格模式，默认 false
  preserveId?: boolean;       // 是否保留序号，默认 false
  citationStyle?: 'numeric' | 'author-date';  // 标引体系
}
```

## 返回值

```typescript
interface ParseResult<T extends ReferenceUnion> {
  reference: T;        // 解析后的结构化对象
  warnings: string[];  // 警告信息
}
```

## 示例

### 基本解析

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

console.log(result.warnings); // []
```

### 保留序号

```typescript
const result = parse(
  '[1] 张三. 论文标题[J]. 期刊名，2025，1：1-10.',
  { preserveId: true }
);

console.log(result.reference.id); // '1'
```

### 指定标准版本

```typescript
// 使用 2015 版本解析
const result = parse(
  '[1] 张三. 论文标题[J]. 期刊名，2025，1：1-10.',
  { version: '2015' }
);
```

### 类型安全

```typescript
import { parse, Journal } from 'gb7714-parser';

// 使用泛型获取精确类型
const { reference } = parse<Journal>(
  '[1] 张三. 人工智能[J]. 现代教育技术，2025，35(2)：15-22.'
);

console.log(reference.journalTitle); // '现代教育技术' - 无需类型断言
```

### 解析带 DOI 的文献

```typescript
const result = parse(
  '[1] 张三. 人工智能[J]. 现代教育技术，2025，35(2)：15-22. DOI:10.1234/test'
);

console.log(result.reference.pid); // 'DOI:10.1234/test'
```

### 解析著者-出版年制引用

```typescript
const result = parse('(张三, 2025)', {
  citationStyle: 'author-date'
});

console.log(result.reference.type); // 'J' (默认)
```
