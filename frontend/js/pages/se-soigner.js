// Pilier « Se soigner » : accéder aux soins et aux aides financières.
// Responsable : voir CONTRIBUTING.md (tableau « Qui travaille sur quoi »).

import { renderAidesHub } from '../aides/hub.js';

export default {
  route: 'se-soigner',
  icon: '🩺',
  title: 'Se soigner',
  intro: 'Découvre les soins et les aides financières adaptés à ta situation.',
  render: renderAidesHub,
  upcoming: [],
};
