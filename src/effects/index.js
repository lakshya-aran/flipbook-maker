import FlipEffect from './FlipEffect.jsx';
import SliderEffect from './SliderEffect.jsx';
import CardsEffect from './CardsEffect.jsx';
import CoverflowEffect from './CoverflowEffect.jsx';

export const EFFECTS = [
  { id: 'magazine', label: 'Magazine', hint: 'Soft pages that curl as they turn', Component: FlipEffect },
  { id: 'book', label: 'Book', hint: 'Hard cover with soft inner pages', Component: FlipEffect },
  { id: 'album', label: 'Album', hint: 'Rigid board pages', Component: FlipEffect },
  { id: 'notebook', label: 'Notebook', hint: 'Spiral-bound spread', Component: FlipEffect },
  { id: 'slider', label: 'Slider', hint: 'Pages slide side to side', Component: SliderEffect },
  { id: 'cards', label: 'Cards', hint: 'A stack you deal through', Component: CardsEffect },
  { id: 'coverflow', label: 'Coverflow', hint: '3D carousel of pages', Component: CoverflowEffect },
  { id: 'onepage', label: 'One page', hint: 'Single page with a curl', Component: FlipEffect },
];

export const getEffect = (id) => EFFECTS.find((e) => e.id === id) || EFFECTS[0];
