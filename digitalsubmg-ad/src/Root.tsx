import React from "react";
import { Composition } from "remotion";
import { DigitalSubAd } from "./DigitalSubAd";
import { DURATION, FPS, HEIGHT, WIDTH } from "./lib/timing";

export const RemotionRoot: React.FC = () => (
  <Composition id="DigitalSubAd" component={DigitalSubAd} durationInFrames={DURATION} fps={FPS} width={WIDTH} height={HEIGHT} />
);
