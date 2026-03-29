export const customViewerStyles = `
  .viewer-transition {
    transition: all 0.15s !important;
  }

  .custom-panel-toggle-btn {
    position: absolute;
    top: 20px;
    right: 0;
    width: 28px;
    height: 48px;
    background: #ffffff;
    border: none;
    border-radius: 999px 0 0 999px;
    color: #1f2937;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    outline: none;
    padding: 0;
    z-index: 9999;
    transition: background-color 0.2s, color 0.2s, transform 0.2s;
  }

  .custom-panel-toggle-btn::before,
  .custom-panel-toggle-btn::after {
    content: "";
    position: absolute;
    right: 0;
    width: 18px;
    height: 18px;
    pointer-events: none;
  }

  .custom-panel-toggle-btn::before {
    top: -16px;
    background: radial-gradient(
      circle at 100% 100%,
      transparent 18px,
      #ffffff 19px
    );
    transform: rotate(180deg);
  }

  .custom-panel-toggle-btn::after {
    bottom: -16px;
    background: radial-gradient(
      circle at 100% 0,
      transparent 18px,
      #ffffff 19px
    );
    transform: rotate(180deg);
  }

  .custom-panel-toggle-btn:focus,
  .custom-panel-toggle-btn:focus-visible {
    outline: none;
    box-shadow: -4px 8px 18px rgba(0, 0, 0, 0.18);
  }

  .custom-panel-toggle-btn:hover::before {
    background: radial-gradient(
      circle at 100% 100%,
      transparent 18px,
      #f8fafc 19px
    );
    transform: rotate(180deg);
  }

  .custom-panel-toggle-btn:hover::after {
    background: radial-gradient(
      circle at 100% 0,
      transparent 18px,
      #f8fafc 19px
    );
    transform: rotate(180deg);
  }

  .custom-viewer-toolbar {
    position: absolute;
    left: 50%;
    bottom: 20px;
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 8px 12px;
    border-radius: 12px;
    background: rgba(0, 0, 0, 0.85);
    transform: translateX(-50%);
    z-index: 10000;
  }

  .custom-prev-btn,
  .custom-next-btn {
    display: flex;
  }

  .custom-toolbar-button,
  .custom-toolbar-value {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 24px;
    height: 24px;
    border: none;
    border-radius: 6px;
    background: transparent;
    color: #ffffff;
    transition: background-color 0.2s ease, color 0.2s ease;
  }

  .custom-toolbar-button {
    cursor: pointer;
  }

  .custom-toolbar-button:hover,
  .custom-toolbar-button:focus-visible {
    background: rgba(255, 255, 255, 0.12);
    outline: none;
  }

  .custom-toolbar-button[data-active="true"] {
    background: rgba(255, 255, 255, 0.18);
    color: #93c5fd;
  }

  .custom-toolbar-value {
    min-width: 56px;
    padding: 0 10px;
    font-size: 13px;
    font-weight: 500;
    cursor: default;
  }

  .custom-toolbar-button::before,
  .custom-toolbar-value::before {
    content: attr(data-tooltip);
    position: absolute;
    left: 50%;
    top: -40px;
    padding: 6px 10px;
    border-radius: 8px;
    background: rgba(15, 23, 42, 0.96);
    color: #ffffff;
    font-size: 12px;
    line-height: 1;
    white-space: nowrap;
    opacity: 0;
    transform: translateX(-50%) translateY(4px);
    pointer-events: none;
    transition: opacity 0.18s ease, transform 0.18s ease;
  }

  .custom-toolbar-button::after,
  .custom-toolbar-value::after {
    content: "";
    position: absolute;
    left: 50%;
    top: -16px;
    width: 0;
    height: 0;
    border-left: 6px solid transparent;
    border-right: 6px solid transparent;
    border-top: 6px solid rgba(15, 23, 42, 0.96);
    transform: translateX(-50%) translateY(4px);
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.18s ease, transform 0.18s ease;
  }

  .custom-toolbar-button:hover::before,
  .custom-toolbar-button:focus-visible::before,
  .custom-toolbar-value:hover::before {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }

  .custom-toolbar-button:hover::after,
  .custom-toolbar-button:focus-visible::after,
  .custom-toolbar-value:hover::after {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }

  @media (max-width: 767px) {
    .custom-prev-btn,
    .custom-next-btn,
    .custom-thumbnail-column {
      display: none !important;
    }

    .custom-panel,
    .custom-panel-toggle-btn {
      display: none !important;
    }
  }
`;
