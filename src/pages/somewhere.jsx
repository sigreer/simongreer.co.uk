import * as React from "react";
import Gallery from '@components/Gallery.astro';
import ScreenshotCarousel from '@/components/Media/_ScreenshotCarousel';

<div className="my-8">
  <ScreenshotCarousel client:only="react" />
</div>