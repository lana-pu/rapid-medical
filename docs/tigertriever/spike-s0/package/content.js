/* Package data. Loaded with a plain <script> tag on purpose: browsers block fetch() of local files,
   so a real package carries its data as a script, not as a separate JSON request.
   manifest.json holds the same data for people and tools; the page never reads it at runtime. */
window.TT_PACKAGE = {
  package: 'Offline test S0',
  version: '0.0-test',
  market: 'Test market',
  built: '2026-11-08',
  note: 'Technical test only. Clips are stand-ins taken from the public Rapid Medical website. Nothing here is training content.',
  stage: { num: 3, name: 'Deployment' },
  configs: [
    {
      id: 'a',
      model: 'Tiger 13',
      handle: 'Legacy slider',
      video: 'media/deployment-legacy-slider.mp4',
      headline: 'Stand-in headline for this stage',
      points: ['Stand-in point 1, read next to the clip.', 'Stand-in point 2.', 'Stand-in point 3.'],
      handleNotes: ['Stand-in note for the legacy slider handle.'],
    },
    {
      id: 'b',
      model: 'Tiger 13',
      handle: 'Precision knob',
      video: 'media/deployment-precision-knob.mp4',
      headline: 'Stand-in headline for this stage',
      points: ['Stand-in point 1, read next to the clip.', 'Stand-in point 2.', 'Stand-in point 3.'],
      handleNotes: ['Stand-in note for the precision knob handle.'],
    },
  ],
};
