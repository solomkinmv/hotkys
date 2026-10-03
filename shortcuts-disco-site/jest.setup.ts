import '@testing-library/jest-dom';
import { jest } from '@jest/globals';

// Radix Select scrolls focused options; jsdom has no layout/scrolling API.
if (typeof HTMLElement !== "undefined") HTMLElement.prototype.scrollIntoView = jest.fn();
