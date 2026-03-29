// 覆盖 Quill 默认的 SVG 高度样式
export const quillOverrideStyles = `
  .ql-snow.ql-toolbar button svg,
  .ql-snow .ql-toolbar button svg {
    height: auto !important;
    color: #8592a3 !important;
  }
  .ql-snow.ql-toolbar .ql-formats button:not(.h-8),
  .ql-snow .ql-toolbar .ql-formats button:not(.h-8) {
    display: flex !important;
    flex-shrink: 0 !important;
    height: auto !important;
    line-height: auto !important;
    width: auto !important;
  }
  .ql-snow.ql-toolbar .ql-formats button:not(.h-8) svg,
  .ql-snow .ql-toolbar .ql-formats button:not(.h-8) svg {
    width: 24px !important;
    height: 24px !important;
  }
  .ql-toolbar.ql-snow,
  .ql-container.ql-snow
  {
    border:none !important;
    }
  /* 下拉菜单隐藏滚动条但允许溢出 */
  .ql-toolbar [id^="dropdown-"] {
    overflow: visible !important;
  }
  .ql-toolbar [id^="dropdown-"]::-webkit-scrollbar {
    display: none !important;
  }
  .ql-toolbar [id^="dropdown-"] {
    scrollbar-width: none !important;
    -ms-overflow-style: none !important;
  }
  /* Tooltip 样式 */
  .ql-toolbar .tooltip-wrapper {
    position: relative;
    display: inline-flex;
  }
  .ql-toolbar .tooltip-wrapper .tooltip {
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    margin-bottom: 8px;
    padding: 6px 10px;
    background: #333;
    color: white;
    font-size: 12px;
    white-space: nowrap;
    border-radius: 6px;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.2s, visibility 0.2s;
    pointer-events: none;
    z-index: 100;
  }
  .ql-toolbar .tooltip-wrapper .tooltip::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 5px solid transparent;
    border-top-color: #333;
  }
  .ql-toolbar .tooltip-wrapper:hover .tooltip {
    opacity: 1;
    visibility: visible;
  }
  /* 下拉菜单打开时隐藏按钮tooltip */
  .ql-toolbar .tooltip-wrapper:has([id^="dropdown-"]:not(.hidden)):hover .tooltip {
    opacity: 0 !important;
    visibility: hidden !important;
  }
  /* placeholder 不使用斜体 */
  .ql-editor.ql-blank::before {
    color: color-mix(in srgb, var(--foreground) 42%, transparent) !important;
    opacity: 1 !important;
    font-style: normal !important;
    font-weight: normal !important;
  }
  /* 链接样式 */
  .ql-editor a {
    color: var(--primary) !important;
    text-decoration: underline;
    cursor: pointer;
  }
  .ql-editor a:hover {
    opacity: 0.8;
  }
  /* 链接 toolbar 样式 */
  .link-toolbar {
    position: absolute;
    z-index: 1000;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: #333;
    color: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    font-size: 13px;
    white-space: nowrap;
  }
  .link-toolbar::after {
    content: '';
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 6px solid transparent;
    border-bottom-color: #333;
  }
  .link-toolbar a {
    color: #6db3f2 !important;
    text-decoration: none;
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .link-toolbar a:hover {
    text-decoration: underline;
  }
  .link-toolbar .divider {
    width: 1px;
    height: 16px;
    background: rgba(255, 255, 255, 0.3);
  }
  .link-toolbar button {
    background: transparent;
    border: none;
    color: white;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 13px;
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .link-toolbar button:hover {
    background: rgba(255, 255, 255, 0.1);
  }
  .link-toolbar button.danger:hover {
    background: rgba(255, 0, 0, 0.2);
    color: #ff6b6b;
  }
  /* 图片选中样式 */
  .ql-editor img.selected {
    outline: 2px solid var(--primary) !important;
    outline-offset: 2px !important;
  }
  /* 图片 toolbar 样式 */
  .image-toolbar {
    position: absolute;
    z-index: 1000;
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 6px 8px;
    background: #333;
    color: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    font-size: 13px;
  }
  .image-toolbar::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 6px solid transparent;
    border-top-color: #333;
  }
  .image-toolbar .divider {
    width: 1px;
    height: 16px;
    background: rgba(255, 255, 255, 0.3);
  }
  .image-toolbar button {
    background: transparent;
    border: none;
    color: white;
    cursor: pointer;
    padding: 6px;
    border-radius: 4px;
    font-size: 13px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .image-toolbar button:hover {
    background: rgba(255, 255, 255, 0.1);
  }
  .image-toolbar button.active {
    background: var(--primary);
  }
  .image-toolbar button.danger:hover {
    background: rgba(255, 0, 0, 0.2);
    color: #ff6b6b;
  }
  /* 图片上传遮罩 */
  .image-upload-overlay {
    position: absolute !important;
    inset: 0 !important;
    background: rgba(0, 0, 0, 0.5) !important;
    border-radius: 8px !important;
    display: flex !important;
    align-items: flex-start !important;
    justify-content: flex-end !important;
    padding: 8px !important;
    z-index: 10 !important;
    pointer-events: auto !important;
  }
  .image-upload-pill {
    background: rgba(0, 0, 0, 0.8) !important;
    color: white !important;
    border-radius: 9999px !important;
    padding: 4px 12px !important;
    font-size: 12px !important;
    display: flex !important;
    align-items: center !important;
    gap: 8px !important;
  }
  .image-upload-pill .progress {
    display: flex !important;
    align-items: center !important;
    gap: 4px !important;
  }
  .image-upload-pill .spinner {
    width: 12px !important;
    height: 12px !important;
    border: 2px solid white !important;
    border-top-color: transparent !important;
    border-radius: 50% !important;
    animation: spin 1s linear infinite !important;
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  .image-upload-pill button {
    background: transparent;
    border: none;
    color: white;
    cursor: pointer;
    padding: 0;
    display: flex;
    align-items: center;
  }
  .image-upload-pill button:hover {
    color: #ff6b6b;
  }
  /* BlotFormatter2 链接 Toolbar 固定宽度 */
  .blot-formatter__overlay {
    position: absolute !important;
    border: none !important;
    background: transparent !important;
    box-shadow: none !important;
    width: auto !important;
    min-width: 0 !important;
    max-width: none !important;
    left: auto !important;
    right: auto !important;
  }
  /* 强制 toolbar 宽度固定 */
  .blot-formatter__toolbar {
    position: relative !important;
    flex-wrap: nowrap !important;
    width: auto !important;
    min-width: auto !important;
    max-width: none !important;
    transform: translateX(-50%) !important;
    left: 50% !important;
    margin-left: 0 !important;
  }
  .blot-formatter__toolbar::after {
    content: '' !important;
    position: absolute !important;
    top: 100% !important;
    left: 50% !important;
    transform: translateX(-50%) !important;
    border: 6px solid transparent !important;
    border-top-color: rgba(0, 0, 0, 0.8) !important;
  }
  .blot-formatter__toolbar > span {
    flex-shrink: 0 !important;
    flex-grow: 0 !important;
    flex-basis: 28px !important;
    min-width: 28px !important;
    max-width: 28px !important;
    width: 28px !important;
    height: 28px !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
  }
  .blot-formatter__toolbar span:hover {
    background: rgba(255, 255, 255, 0.15) !important;
  }
  .blot-formatter__toolbar span svg {
    color: white !important;
    background: transparent !important;
  }
  /* 图片 overlay 样式 */
  .blot-formatter__overlay:not(:empty) {
    border: 2px solid var(--primary) !important;
    border-radius: 8px !important;
    background: transparent !important;
  }
  /* 图片标题/alt 样式 */
  .ql-image-wrapper {
    position: relative;
    display: inline-block;
  }
  .ql-image-wrapper.selected .ql-image {
    outline: 2px solid var(--primary);
    outline-offset: 2px;
  }
  .ql-image-caption {
    display: block;
    text-align: center;
    font-size: 12px;
    color: #666;
    margin-top: 4px;
    padding: 4px 8px;
    min-height: 20px;
    cursor: text;
    border: none;
    outline: none;
    background: transparent;
    width: 100%;
    box-sizing: border-box;
  }
  .ql-image-caption:focus {
    outline: none;
    border: none;
  }
  .ql-image-caption:empty::before {
    content: attr(data-placeholder);
    color: #999;
    pointer-events: none;
  }
  .ql-image-caption:empty:focus::before {
    color: #bbb;
  }
  .emoji-panel-dropdown {
    width: min(600px, calc(100vw - 32px)) !important;
    overflow: hidden !important;
  }
  .emoji-panel-tabs {
    height: 46px !important;
    display: grid !important;
    grid-template-columns: 28px minmax(0, 1fr) 28px;
    align-items: center;
    gap: 8px;
    scrollbar-width: none !important;
    -ms-overflow-style: none !important;
  }

  .emoji-panel-tabs::-webkit-scrollbar {
    display: none !important;
  }
  .emoji-panel-tabs-viewport {
    min-width: 0;
    scrollbar-width: none !important;
    -ms-overflow-style: none !important;
  }
  .emoji-panel-tabs-viewport::-webkit-scrollbar {
    display: none !important;
  }
  .emoji-panel-nav {
    flex-shrink: 0 !important;
  }
  .emoji-panel-tab {
  display: inline-flex !important;
    flex: 0 0 auto !important;
    height:38px !important;
    width:54px !important;
    border:none !important;
    border-radius: 8px !important;
    align-items: center !important;
    justify-content: center !important;
    background: transparent !important;
  }
  .emoji-panel-tab[data-active="true"] {
    background: var(--color-card) !important;
    border-color: color-mix(in srgb, var(--primary) 28%, transparent) !important;
  }
  .emoji-panel-tab-image {
    width: 28px;
    height: 28px;
    object-fit: contain;
    border-radius: 8px;
  }
  .emoji-panel-tab-emoji,
  .emoji-panel-tab-fallback {
    width: 28px;
    height: 28px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 600;
    background: var(--muted);
    color: var(--foreground);
  }
  .emoji-panel-list {
    height: 256px !important;
    grid-template-columns: repeat(auto-fill, minmax(48px, 1fr));
    scrollbar-width: thin;
  }
  .emoji-panel-item img {
    user-select: none;
    -webkit-user-drag: none;
  }
  .emoji-panel-state {
    grid-column: 1 / -1;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #8592a3;
    font-size: 13px;
  }

`;
