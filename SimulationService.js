// Time model: discrete game days. The simulation advances ONLY when the player
// presses "Advance day". There is no offline/elapsed-time catch-up, so changing the
// device clock cannot grant progress.
export const Simulation = {
  advanceDay(s) {
    s.day += 1;
    return s.day;
  },
};
