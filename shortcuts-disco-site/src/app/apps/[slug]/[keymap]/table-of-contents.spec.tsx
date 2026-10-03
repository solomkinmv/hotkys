import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import TableOfContents from "./table-of-contents";

const titles = ["General", "Preferences", "Panels", "Saving"];
const sections = titles.map((title) => ({ title, hotkeys: [] }));
let positions: Record<string, number>;
let resizeCallback: ResizeObserverCallback;
const disconnect = jest.fn();

function renderContents() {
  const sectionRefs = {
    current: Object.fromEntries(
      titles.map((title) => [title, React.createRef<HTMLDivElement>()]),
    ),
  };
  const result = render(
    <>
      <TableOfContents sections={sections} sectionRefs={sectionRefs} />
      {titles.map((title) => (
        <div key={title} ref={sectionRefs.current[title]} id={title} />
      ))}
    </>,
  );
  for (const title of titles) {
    sectionRefs.current[title].current!.getBoundingClientRect = () =>
      ({ top: positions[title] }) as DOMRect;
  }
  act(() => jest.runOnlyPendingTimers());
  return result;
}

function scrollTo(y: number) {
  Object.defineProperty(window, "scrollY", { configurable: true, value: y });
  fireEvent.scroll(window);
  act(() => jest.runOnlyPendingTimers());
}

function expectActive(title: string) {
  const links = screen.getAllByRole("link");
  expect(links.filter((link) => link.hasAttribute("aria-current"))).toEqual([
    screen.getByRole("link", { name: `${title} 0` }),
  ]);
}

describe("TableOfContents reading position", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    positions = { General: 460, Preferences: 1300, Panels: 1460, Saving: 8000 };
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: 800,
    });
    Object.defineProperty(window, "scrollY", { configurable: true, value: 0 });
    Object.defineProperty(document.documentElement, "scrollHeight", {
      configurable: true,
      value: 10000,
    });
    global.IntersectionObserver = jest.fn().mockImplementation(() => ({
      observe: jest.fn(),
      disconnect: jest.fn(),
    })) as typeof IntersectionObserver;
    global.ResizeObserver = jest.fn().mockImplementation((callback) => {
      resizeCallback = callback as ResizeObserverCallback;
      return { observe: jest.fn(), disconnect };
    }) as typeof ResizeObserver;
    disconnect.mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("keeps the section at the top active while other sections enter the viewport", () => {
    renderContents();
    expectActive("General");

    positions = { General: -1200, Preferences: 32, Panels: 193, Saving: 6500 };
    scrollTo(1700);
    expectActive("Preferences");

    // Preferences has left the screen, but Panels never crossed an intersection threshold.
    positions = {
      General: -1755,
      Preferences: -523,
      Panels: -362,
      Saving: 5945,
    };
    scrollTo(2255);
    expectActive("Panels");

    // The next heading must reach the reading position before it takes over.
    positions.Saving = 34;
    scrollTo(8100);
    expectActive("Panels");
    positions.Saving = 32;
    scrollTo(8102);
    expectActive("Saving");

    positions.Saving = 34;
    scrollTo(8100);
    expectActive("Panels");
  });

  it("selects the final section at the page bottom even if its heading cannot reach the top", () => {
    positions = {
      General: -9000,
      Preferences: -7768,
      Panels: -7607,
      Saving: 300,
    };
    renderContents();
    scrollTo(9200);
    expectActive("Saving");

    positions.Saving = 400;
    scrollTo(9100);
    expectActive("Panels");
  });

  it("recalculates after layout changes and stops listening after unmount", () => {
    const { unmount } = renderContents();
    positions = { General: -1000, Preferences: -200, Panels: 32, Saving: 6400 };
    act(() => {
      resizeCallback([], {} as ResizeObserver);
      jest.runOnlyPendingTimers();
    });
    expectActive("Panels");

    unmount();
    expect(disconnect).toHaveBeenCalledTimes(1);
    fireEvent.scroll(window);
    expect(jest.getTimerCount()).toBe(0);
  });
});
