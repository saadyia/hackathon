// Pilier « Se soigner » : accéder aux soins et aux aides financières.
// Responsable : voir CONTRIBUTING.md (tableau « Qui travaille sur quoi »).

import { renderSimulator } from '../aides/simulator.js';

export default {
  route: 'se-soigner',
  icon: '🩺',
  title: 'Se soigner',
  intro: 'Accéder aux soins et aux aides financières adaptées à ta situation.',

  render: renderSimulator,

  upcoming: [
    'Prise de rendez-vous et rappels compatibles avec ton emploi du temps',
  ],
};

