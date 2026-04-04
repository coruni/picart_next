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
  /* 排除分割线面板中的 SVG 预览 */
  .ql-snow.ql-toolbar .ql-formats button:not(.h-8) #dropdown-divider-panel svg,
  .ql-snow .ql-toolbar .ql-formats button:not(.h-8) #dropdown-divider-panel svg,
  #dropdown-divider-panel svg {
    width: auto !important;
    height: auto !important;
  }
  .ql-toolbar [id^="dropdown-"]{
    min-width:max-content !important;
  }
  /* Mobile toolbar button sizes */
  @media (max-width: 767px) {
    .ql-snow.ql-toolbar .ql-formats button:not(.h-8) svg,
    .ql-snow .ql-toolbar .ql-formats button:not(.h-8) svg {
      width: 20px !important;
      height: 20px !important;
    }
    .ql-snow.ql-toolbar .ql-formats,
    .ql-snow .ql-toolbar .ql-formats {
      gap: 0.5rem !important;
    }
    .ql-toolbar .tooltip-wrapper .tooltip {
      display: none !important;
    }
    .ql-snow.ql-toolbar button,
    .ql-snow .ql-toolbar button {
      padding: 2px !important;
    }
    .ql-toolbar {
      gap:6px !important;
    }
    /* Dropdown triggers on mobile */
    .ql-toolbar .tooltip-wrapper button[class*="px-2"] {
      padding-left: 6px !important;
      padding-right: 6px !important;
    }
    /* More button on mobile */
    .ql-toolbar .tooltip-wrapper button.flex.w-full {
      width: auto !important;
      min-width: 28px !important;
      height: 28px !important;
    }
    /* Dropdown menus on mobile - prevent overflow (except emoji panel) */
    .ql-toolbar [id^="dropdown-"]:not(#dropdown-emoji-panel) {
      min-width: max-content !important;
      left: auto !important;
      right: 0 !important;
    }
    /* Color dropdown on mobile */
    .ql-toolbar [id^="dropdown-textColor"],
    .ql-toolbar [id^="dropdown-bgColor"] {
      left: auto !important;
      right: 0 !important;
      width: auto !important;
      max-width: calc(100vw - 32px) !important;
    }
    /* Emoji panel dropdown on mobile - centered */
    #dropdown-emoji-panel.emoji-panel-dropdown {
      left: -400% !important;
      right: auto !important;
      width: calc(100vw - 16px) !important;
      max-width: none !important;
      min-width: 0 !important;
    }
    .emoji-panel-tabs {
      height: 42px !important;
      grid-template-columns: 24px minmax(0, 1fr) 24px;
      gap: 4px;
    }
    .emoji-panel-tab {
      height: 34px !important;
      width: 44px !important;
    }
    .emoji-panel-tab-image {
      width: 24px;
      height: 24px;
    }
    .emoji-panel-tab-emoji,
    .emoji-panel-tab-fallback {
      width: 24px;
      height: 24px;
      font-size: 14px;
    }
    .emoji-panel-list {
      height: 220px !important;
      grid-template-columns: repeat(auto-fill, minmax(40px, 1fr));
    }
    .emoji-panel-list .emoji-panel-item {
      height: 40px !important;
      width: 40px !important;
      min-height: 40px !important;
      min-width: 40px !important;
    }
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
  .ql-toolbar .emoji-dropdown-wrapper {
    position: relative;
  }
  .ql-toolbar .emoji-panel {
    position: absolute;
    top: calc(100% + 8px);
    left: 0px;
    z-index: 80;
    width: min(50vw, 500px);
    height: 320px;
    background: #f7f8fb;
    border: 1px solid #e6e9f2;
    border-radius: 20px;
    box-shadow: 0 18px 46px rgba(17, 24, 39, 0.16);
    overflow: hidden;
  }
  .ql-toolbar .emoji-panel.hidden {
    display: none !important;
  }
  .ql-toolbar .emoji-panel button {
    padding: 0 !important;
  }
  .ql-toolbar .emoji-panel-header {
    display: grid;
    grid-template-columns: 56px 1fr 40px 40px;
    align-items: center;
    column-gap: 8px;
    height: 48px;
    padding: 0 12px;
    border-bottom: 1px solid #e6e9f2;
    background: #eef1f7;
  }
  .ql-toolbar .emoji-header-btn {
    width: 32px;
    height: 32px;
    border-radius: 999px;
    border: none;
    background: transparent;
    color: #94a3b8;
    font-size: 24px;
    line-height: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }
  .ql-toolbar .emoji-header-btn:hover {
    background: rgba(148, 163, 184, 0.16);
    color: #64748b;
  }
  .ql-toolbar .emoji-header-add {
    border: 1px solid #d3dae7;
    color: #94a3b8;
    font-size: 24px;
  }
  .ql-toolbar .emoji-tabs-scroll {
    overflow-x: auto;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
  .ql-toolbar .emoji-tabs-scroll::-webkit-scrollbar {
    display: none;
  }
  .ql-toolbar .emoji-tabs {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-width: max-content;
  }
  .ql-toolbar .emoji-tab-btn {
    width: 24px !important;
    height: 24px !important;
    border: none;
    border-radius: 14px;
    background: transparent;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  .ql-toolbar .emoji-tab-btn:hover,
  .ql-toolbar .emoji-tab-btn.is-active {
    background: #fff;
  }
  .ql-toolbar .emoji-panel-body {
    height: calc(100% - 50px);
    overflow-y: auto;
    padding: 18px 18px 24px;
    scrollbar-width: thin;
  }
  .ql-toolbar .emoji-section {
    margin-bottom: 18px;
  }
  .ql-toolbar .emoji-section-title {
    margin: 0 0 12px;
    font-size: 18px;
    font-weight: 500;
    color: #334155;
  }
  .ql-toolbar .emoji-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(24px, 24px));
    justify-content: start;
    gap: 8px;
  }
  .ql-toolbar .emoji-panel .emoji-item-btn {
    width: 24px !important;
    height: 24px !important;
    min-width: 24px !important;
    min-height: 24px !important;
    border-radius: 6px;
    border: none;
    background: transparent;
    font-size: 24px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: transform 0.15s ease, background-color 0.15s ease;
  }
  .ql-toolbar .emoji-item-btn:hover {
    background: #ffffff;
    transform: translateY(-1px);
  }
  .ql-toolbar .emoji-empty {
    color: #94a3b8;
    font-size: 13px;
    padding: 8px 4px;
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
    overflow: visible !important;
  }
  /* 强制 toolbar 宽度固定 */
  .blot-formatter__toolbar {
    position: absolute !important;
    top: 0 !important;
    display: inline-flex !important;
    flex-wrap: nowrap !important;
    width: max-content !important;
    min-width: max-content !important;
    max-width: max-content !important;
    transform: translate(-50%, calc(-100% - 8px)) !important;
    left: 50% !important;
    margin-left: 0 !important;
    z-index: 2 !important;
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
