import type contentJson from '../content.json';

export type Content = typeof contentJson;

export type Assets = {
  /** Logo DigitalSub complet (symbole + logotype). */
  logo: string;
  /** Symbole DigitalSub seul (en-têtes). */
  icon: string;
};

export type SceneProps = { t: number; content: Content; assets: Assets };
