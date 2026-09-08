# format

将结构化对象格式化为符合 GB/T 7714 的字符串。

## 函数签名

```typescript
function format(
  reference: ReferenceUnion,
  options?: FormatOptions
): string
```

## 参数

### reference

- 类型: `ReferenceUnion`
- 必填: 是

要格式化的结构化引用对象。

### options

- 类型: `FormatOptions`
- 必填: 否

格式化选项。

```typescript
interface FormatOptions {
  version?: '2015' | '2025';  // 输出标准版本，默认 '2025'
  citationStyle?: 'numeric' | 'author-date';  // 标引体系
  includeAccessDate?: boolean;  // 是否输出引用日期，默认 false
}
```

## 返回值

格式化后的引用字符串。

## 示例

### 基本格式化

```typescript
import { parse, format } from 'gb7714-parser';

const result = parse(
  '[1] 张三，李四. 人工智能在教育中的应用[J]. 现代教育技术，2025，35(2)：15-22.'
);

const formatted = format(result.reference);
console.log(formatted);
// 张三, 李四 人工智能在教育中的应用[J]. 现代教育技术, 2025, 35(2): 15-22.
```

### 指定版本

```typescript
const formatted = format(result.reference, { version: '2015' });
```

### 包含引用日期

```typescript
const formatted = format(result.reference, { includeAccessDate: true });
```

### 格式化不同类型

```typescript
// 期刊
const journal = parse('[1] 张三. 论文[J]. 期刊, 2025, 1: 1-10.');
console.log(format(journal.reference));
// 张三 论文[J]. 期刊, 2025, 1: 1-10.

// 图书
const book = parse('[1] 张三. 书名[M]. 北京: 出版社, 2025.');
console.log(format(book.reference));
// 张三 书名[M]. 北京: 出版社, 2025.

// 学位论文
const thesis = parse('[1] 张三. 论文[D]. 北京: 大学, 2025.');
console.log(format(thesis.reference));
// 张三 论文[D]. 北京: 大学, 2025.
```

### 解析后再格式化

```typescript
import { parse, format } from 'gb7714-parser';

const input = '[1] 张三，李四. 人工智能在教育中的应用[J]. 现代教育技术，2025，35(2)：15-22.';
const result = parse(input);
const formatted = format(result.reference);

// 可以用于规范化格式
console.log(formatted);
```
