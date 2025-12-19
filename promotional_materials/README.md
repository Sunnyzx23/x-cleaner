# X Cleaner 宣传材料生成指南

## 📁 文件说明

本目录包含三个 HTML 模板文件，用于生成 Chrome Web Store 所需的宣传材料：

1. **small_tile_440x280.html** - 小型宣传图块 (440x280 像素)
2. **large_tile_920x680.html** - 大型宣传图块 (920x680 像素)
3. **screenshot_popup_1280x800.html** - 应用截图 (1280x800 像素)

## 🎨 生成 PNG 图片的方法

### 方法一：使用浏览器截图（推荐）

1. **打开 HTML 文件**
   - 在 Chrome 浏览器中打开对应的 HTML 文件
   - 按 `F11` 进入全屏模式以获得最佳效果

2. **调整浏览器窗口**
   - 按 `Cmd + Option + I` (Mac) 或 `F12` (Windows) 打开开发者工具
   - 点击右上角的三个点 → More tools → Rendering
   - 在 "Emulate CSS media type" 中选择 "print"

3. **截图**
   - 按 `Cmd + Shift + 4` (Mac) 或使用 Windows 截图工具
   - 精确选择图片区域进行截图
   - 保存为 PNG 格式

### 方法二：使用 Chrome 开发者工具截图

1. **打开 HTML 文件**
   - 在 Chrome 中打开 HTML 文件
   - 按 `Cmd + Option + I` 打开开发者工具

2. **设置设备尺寸**
   - 点击设备工具栏图标（或按 `Cmd + Shift + M`）
   - 在顶部设置精确尺寸：
     - 小型图块: 440 x 280
     - 大型图块: 920 x 680
     - 截图: 1280 x 800

3. **截图**
   - 按 `Cmd + Shift + P` 打开命令面板
   - 输入 "Capture screenshot"
   - 选择 "Capture node screenshot" 或 "Capture full size screenshot"
   - 图片会自动下载

### 方法三：使用在线工具

访问以下网站将 HTML 转换为 PNG：
- https://html2canvas.hertzen.com/
- https://www.web-capture.net/
- https://htmlcsstoimage.com/

## 📐 尺寸要求

确保生成的 PNG 图片符合以下尺寸：

| 文件 | 尺寸 | 用途 |
|------|------|------|
| small_tile_440x280.html | 440 x 280 px | Chrome Web Store 搜索结果 |
| large_tile_920x680.html | 920 x 680 px | 插件详情页顶部 |
| screenshot_popup_1280x800.html | 1280 x 800 px | 应用截图（至少1张） |

## 🎯 生成的文件命名

建议将生成的 PNG 文件命名为：
- `x-cleaner-small-tile-440x280.png`
- `x-cleaner-large-tile-920x680.png`
- `x-cleaner-screenshot-popup-1280x800.png`

## ✅ 检查清单

生成图片后，请检查：
- [ ] 图片尺寸完全符合要求
- [ ] 文字清晰可读
- [ ] 颜色显示正确
- [ ] 没有模糊或失真
- [ ] PNG 格式，背景透明度正确

## 🚀 上传到 Chrome Web Store

1. 访问 [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. 选择 X Cleaner 插件
3. 在 "Store listing" 部分上传生成的图片
4. 保存并提交审核

## 💡 提示

- 如果需要修改设计，直接编辑 HTML 文件中的 CSS 样式
- 可以使用浏览器的缩放功能（Cmd +/-）来预览不同尺寸
- 建议在不同浏览器中预览以确保兼容性
