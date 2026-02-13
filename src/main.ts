import { Canvas } from "./UI/canvas";
import { UIController } from "./UI/controller";
import { Elements } from "./UI/elements";

const canvas = new Canvas();
const controller = new UIController(canvas);
const elements = new Elements(controller);

controller.attachElements(elements);
