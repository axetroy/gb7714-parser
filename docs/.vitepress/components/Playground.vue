<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { parse, format, validate } from '../../../src/index.ts'
import appendixB from '../data/appendix-b-examples.json'

type Mode = 'parse' | 'format' | 'validate'

interface Example {
  id: number
  content: string
}

interface ExampleGroup {
  section: string
  count: number
  examples: Example[]
}

// 附录 B 标准示例（来自 GB/T 7714-2025 附录 B，每条带全局序号 [NUMBER]）
const exampleGroups = computed<ExampleGroup[]>(() => {
  let globalIndex = 0
  return appendixB.groups.map(group => ({
    section: group.section,
    count: group.count,
    examples: group.examples.map(ex => ({
      id: ++globalIndex,
      content: ex.content,
    })),
  }))
})

// 默认加载第一个示例 [1]
const firstExample = exampleGroups.value[0]!.examples[0]!

const input = ref(`[${firstExample.id}] ${firstExample.content}`)
const mode = ref<Mode>('parse')
const output = ref('')
const errors = ref<string[]>([])
const warnings = ref<string[]>([])
const isValid = ref<boolean | null>(null)

// 解析选项
const parseVersion = ref<'2015' | '2025'>('2025')
const preserveId = ref(false)

// 格式化选项
const formatVersion = ref<'2015' | '2025'>('2025')

const activeGroupId = ref(0)
const activeExampleId = ref(firstExample.id)

// 当前选中分组的示例列表
const activeExamples = computed(() => {
  const group = exampleGroups.value[activeGroupId.value]
  return group ? group.examples : []
})

const processInput = () => {
  errors.value = []
  warnings.value = []
  output.value = ''
  isValid.value = null

  if (!input.value.trim()) {
    errors.value = ['请输入参考文献']
    return
  }

  try {
    if (mode.value === 'parse') {
      const result = parse(input.value, {
        version: parseVersion.value,
        preserveId: preserveId.value
      })

      output.value = JSON.stringify(result.reference, null, 2)
      warnings.value = result.warnings || []

    } else if (mode.value === 'format') {
      // 先解析，再格式化
      const parseResult = parse(input.value, {
        version: formatVersion.value
      })

      const formatted = format(parseResult.reference, {
        version: formatVersion.value
      })

      output.value = formatted
      warnings.value = parseResult.warnings || []

    } else if (mode.value === 'validate') {
      const parseResult = parse(input.value)
      const report = validate(parseResult.reference)

      isValid.value = report.valid
      output.value = JSON.stringify(report, null, 2)
      warnings.value = parseResult.warnings || []

      if (!report.valid) {
        errors.value = report.errors.map(e => `[${e.level}] ${e.field}: ${e.message}`)
      }
    }
  } catch (e) {
    errors.value = [e instanceof Error ? e.message : '解析失败']
  }
}

// 加载标准示例：在原文前加上全局序号 [NUMBER]
const loadExample = (example: Example) => {
  activeExampleId.value = example.id
  input.value = `[${example.id}] ${example.content}`
  processInput()
}

const copyOutput = async () => {
  if (output.value) {
    await navigator.clipboard.writeText(output.value)
  }
}

const modeLabel = computed(() => {
  switch (mode.value) {
    case 'parse': return '解析'
    case 'format': return '格式化'
    case 'validate': return '校验'
  }
})

watch(mode, () => {
  output.value = ''
  errors.value = []
  warnings.value = []
  isValid.value = null
})
</script>

<template>
  <div class="playground-container">
    <div class="playground-header">
      <h3 style="margin: 0;">在线 Playground</h3>
      <div class="playground-tabs">
        <button
          class="playground-tab"
          :class="{ active: mode === 'parse' }"
          @click="mode = 'parse'"
        >
          解析
        </button>
        <button
          class="playground-tab"
          :class="{ active: mode === 'format' }"
          @click="mode = 'format'"
        >
          格式化
        </button>
        <button
          class="playground-tab"
          :class="{ active: mode === 'validate' }"
          @click="mode = 'validate'"
        >
          校验
        </button>
      </div>
    </div>

    <!-- 解析选项 -->
    <div class="playground-options" v-if="mode === 'parse'">
      <div class="playground-option">
        <label>标准版本:</label>
        <select v-model="parseVersion">
          <option value="2015">GB/T 7714-2015</option>
          <option value="2025">GB/T 7714-2025</option>
        </select>
      </div>
      <div class="playground-option">
        <label>
          <input type="checkbox" v-model="preserveId">
          保留序号
        </label>
      </div>
    </div>

    <!-- 格式化选项 -->
    <div class="playground-options" v-if="mode === 'format'">
      <div class="playground-option">
        <label>输出版本:</label>
        <select v-model="formatVersion">
          <option value="2015">GB/T 7714-2015</option>
          <option value="2025">GB/T 7714-2025</option>
        </select>
      </div>
    </div>

    <!-- GB/T 7714-2025 附录 B 标准示例 -->
    <div class="playground-examples">
      <div class="playground-examples-title">
        GB/T 7714-2025 附录 B 标准示例（{{ exampleGroups.reduce((n, g) => n + g.examples.length, 0) }} 条）:
      </div>
      <div class="playground-example-groups">
        <div class="playground-example-group">
          <label class="playground-group-label">选择分组:</label>
          <select v-model.number="activeGroupId">
            <option v-for="(group, index) in exampleGroups" :key="index" :value="index">
              {{ group.section }}（{{ group.count }}）
            </option>
          </select>
        </div>
        <div class="playground-example-buttons">
          <button
            class="playground-example-button"
            :class="{ active: activeExampleId === example.id }"
            v-for="example in activeExamples"
            :key="example.id"
            @click="loadExample(example)"
            :title="example.content"
          >
            [{{ example.id }}]
          </button>
        </div>
      </div>
    </div>

    <!-- 输入 -->
    <textarea
      class="playground-input"
      v-model="input"
      :placeholder="mode === 'parse' ? '请输入参考文献字符串...' : '请输入参考文献字符串...'"
    ></textarea>

    <!-- 操作按钮 -->
    <div class="playground-actions">
      <button
        class="playground-button"
        @click="processInput"
      >
        {{ modeLabel }}
      </button>
    </div>

    <!-- 结果 -->
    <div class="playground-result" v-if="output">
      <div class="playground-result-header">
        <span>结果</span>
        <button class="playground-copy-button" @click="copyOutput">
          复制
        </button>
      </div>
      <div class="playground-result-content">{{ output }}</div>
    </div>

    <!-- 校验成功 -->
    <div class="playground-success" v-if="isValid === true">
      ✓ 校验通过，该引用符合 GB/T 7714 规范
    </div>

    <!-- 错误 -->
    <div class="playground-error" v-if="errors.length > 0">
      <div v-for="(error, index) in errors" :key="index">{{ error }}</div>
    </div>

    <!-- 警告 -->
    <div class="playground-warnings" v-if="warnings.length > 0">
      <div style="font-weight: 500; margin-bottom: 8px;">警告:</div>
      <div v-for="(warning, index) in warnings" :key="index">{{ warning }}</div>
    </div>
  </div>
</template>
