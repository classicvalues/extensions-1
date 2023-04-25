import { proxy } from "comlink";
import {
  DisposerFunction,
  extensionPort,
  OnThemeChangeListener,
  OnThemeChangeValuesListener,
  ThemeValuesGlobal,
} from "src";

/**
 * Returns all metadata on the current theme including syntax highlighting, description, HSL, token values, and more.
 */
export async function getCurrentTheme() {
  return await extensionPort.getCurrentTheme();
}

/**
 * Returns the current theme's global token values.
 */
export async function getCurrentThemeValues(): Promise<ThemeValuesGlobal> {
  return await extensionPort.getCurrentThemeValues();
}

/**
 * Fires the `callback` parameter function with the updated theme when the user's theme changes.
 */
export async function onThemeChange(
  callback: OnThemeChangeListener
): Promise<DisposerFunction> {
  return await extensionPort.onThemeChange(proxy(callback));
}

/**
 * Fires the `callback` parameter function with the updated theme values when the user's theme changes.
 */
export async function onThemeChangeValues(
  callback: OnThemeChangeValuesListener
): Promise<DisposerFunction> {
  return await extensionPort.onThemeChangeValues(proxy(callback));
}
