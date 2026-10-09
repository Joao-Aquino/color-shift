import { Vibrant, BasicPipeline } from "@vibrant/core";
import { DefaultGenerator } from "@vibrant/generator-default";
import { BrowserImage } from "@vibrant/image-browser";
import { MMCQ } from "@vibrant/quantizer-mmcq";

// The browser-only pipeline avoids node-vibrant's unused Node/Jimp image backend.
Vibrant.DefaultOpts.ImageClass = BrowserImage;
Vibrant.DefaultOpts.quantizer = "mmcq";
Vibrant.DefaultOpts.generators = ["default"];
Vibrant.DefaultOpts.filters = ["default"];
// eslint-disable-next-line react-hooks/rules-of-hooks -- This configures Vibrant; it is not a React hook.
Vibrant.use(new BasicPipeline()
  .filter.register("default", (r, g, b, a) => a >= 125 && !(r > 250 && g > 250 && b > 250))
  .quantizer.register("mmcq", MMCQ)
  .generator.register("default", DefaultGenerator));

export { Vibrant };
