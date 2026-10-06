import wasm from '../../node_modules/@resvg/resvg-wasm/index_bg.wasm';
import sans from '../assets/NotoSans.ttf';
import sansBold from '../assets/NotoSansBold.ttf';
import serif from '../assets/NotoSerif.ttf';
import flower from '../../public/images/decorations/floral.svg';
import {configureRenderer} from './preview.js';
import worker from './index.js';

configureRenderer(wasm,[sans,sansBold,serif],flower);
export default worker;
