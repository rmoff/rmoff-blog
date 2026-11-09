/*! Lemmings for rmoff.net.
 * Based on MarkBlah/lemmings (https://github.com/MarkBlah/lemmings), licence pending: https://github.com/MarkBlah/lemmings/issues/1
 * Changes for rmoff.net: does nothing with reduced motion; can keep to a part of the page (data-scope)
 * with the floor at the page bottom (data-floor="page"); tap jobs (blocker, umbrella); a home exit
 * ([data-lemming-exit]); walkers hop when you click near them.
 *
 * Script tag options (data-*): count (walkers to start with), spawn (selector they drop onto),
 * floor ("page" or "window"), scope (selector: only surfaces inside it count, until a reader picks a
 * walker up; from then on every surface on the page counts, so a dropped or thrown walker lands on it).
 * API: window.lemmings.add({x, y}) in page px; lemmings.out / lemmings.home.
 * Event: document "lemmings:change", detail {out, home}.
 */
(() => {
  if (window.lemmings) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const cfg = (document.currentScript && document.currentScript.dataset) || {};
  const PAGE_FLOOR = cfg.floor === 'page';
  const SCOPE = cfg.scope || null;
  const EXIT = '[data-lemming-exit]';

  const CSS = ".sprite{display:inline-block;position:relative}\n.sprite::before{content:\"\";position:absolute;top:-1px;left:-1px;width:1px;height:1px;animation:var(--a) var(--d) step-end infinite}\n.s1{width:8px;height:10px;--a:s1;--d:560ms}\n@keyframes s1{0%{box-shadow:3px 2px #038f03,4px 2px #038f03,5px 2px #038f03,6px 2px #038f03,3px 3px #038f03,4px 3px #038f03,5px 3px #f3cfd3,4px 4px #f3cfd3,5px 4px #f3cfd3,6px 4px #f3cfd3,4px 5px #f3cfd3,5px 5px #0357d3,4px 6px #f3cfd3,5px 6px #0357d3,4px 7px #f3cfd3,5px 7px #0357d3,4px 8px #0357d3,5px 8px #0357d3,3px 9px #f3cfd3,4px 9px #0357d3,5px 9px #0357d3,4px 10px #f3cfd3,5px 10px #f3cfd3}12.5%{box-shadow:4px 1px #038f03,6px 1px #038f03,3px 2px #038f03,4px 2px #038f03,5px 2px #038f03,3px 3px #038f03,4px 3px #038f03,5px 3px #f3cfd3,4px 4px #f3cfd3,5px 4px #f3cfd3,6px 4px #f3cfd3,4px 5px #f3cfd3,5px 5px #0357d3,3px 6px #f3cfd3,4px 6px #0357d3,5px 6px #0357d3,3px 7px #f3cfd3,4px 7px #0357d3,5px 7px #0357d3,7px 7px #f3cfd3,4px 8px #0357d3,5px 8px #0357d3,7px 8px #f3cfd3,3px 9px #0357d3,4px 9px #0357d3,6px 9px #f3cfd3,3px 10px #f3cfd3,4px 10px #f3cfd3}25%{box-shadow:3px 2px #038f03,5px 2px #038f03,3px 3px #038f03,4px 3px #038f03,5px 3px #038f03,4px 4px #038f03,5px 4px #f3cfd3,4px 5px #f3cfd3,5px 5px #f3cfd3,6px 5px #f3cfd3,3px 6px #f3cfd3,4px 6px #f3cfd3,5px 6px #0357d3,3px 7px #f3cfd3,4px 7px #0357d3,5px 7px #0357d3,2px 8px #f3cfd3,3px 8px #f3cfd3,4px 8px #0357d3,5px 8px #0357d3,6px 8px #0357d3,3px 9px #0357d3,4px 9px #0357d3,5px 9px #0357d3,6px 9px #0357d3,2px 10px #f3cfd3,3px 10px #f3cfd3,6px 10px #f3cfd3,7px 10px #f3cfd3}37.5%{box-shadow:4px 2px #038f03,5px 2px #038f03,3px 3px #038f03,4px 3px #038f03,5px 3px #f3cfd3,6px 3px #038f03,3px 4px #038f03,4px 4px #f3cfd3,5px 4px #f3cfd3,6px 4px #f3cfd3,4px 5px #f3cfd3,5px 5px #0357d3,4px 6px #f3cfd3,5px 6px #0357d3,3px 7px #f3cfd3,4px 7px #0357d3,5px 7px #0357d3,4px 8px #0357d3,5px 8px #0357d3,2px 9px #f3cfd3,3px 9px #0357d3,4px 9px #0357d3,5px 9px #0357d3,6px 9px #0357d3,2px 10px #f3cfd3,5px 10px #f3cfd3,6px 10px #f3cfd3}50%{box-shadow:3px 2px #038f03,4px 2px #038f03,5px 2px #038f03,6px 2px #038f03,3px 3px #038f03,4px 3px #038f03,5px 3px #f3cfd3,3px 4px #038f03,4px 4px #f3cfd3,5px 4px #f3cfd3,6px 4px #f3cfd3,4px 5px #f3cfd3,5px 5px #0357d3,4px 6px #0357d3,5px 6px #f3cfd3,4px 7px #f3cfd3,5px 7px #0357d3,4px 8px #0357d3,5px 8px #0357d3,3px 9px #f3cfd3,4px 9px #0357d3,5px 9px #0357d3,4px 10px #f3cfd3,5px 10px #f3cfd3}62.5%{box-shadow:4px 1px #038f03,6px 1px #038f03,3px 2px #038f03,4px 2px #038f03,5px 2px #038f03,3px 3px #038f03,4px 3px #038f03,5px 3px #f3cfd3,4px 4px #f3cfd3,5px 4px #f3cfd3,6px 4px #f3cfd3,4px 5px #f3cfd3,5px 5px #0357d3,4px 6px #0357d3,5px 6px #f3cfd3,4px 7px #0357d3,5px 7px #f3cfd3,7px 7px #f3cfd3,4px 8px #0357d3,5px 8px #0357d3,7px 8px #f3cfd3,3px 9px #0357d3,4px 9px #0357d3,6px 9px #f3cfd3,3px 10px #f3cfd3,4px 10px #f3cfd3}75%{box-shadow:3px 2px #038f03,5px 2px #038f03,3px 3px #038f03,4px 3px #038f03,5px 3px #038f03,4px 4px #038f03,5px 4px #f3cfd3,4px 5px #f3cfd3,5px 5px #f3cfd3,6px 5px #f3cfd3,4px 6px #0357d3,5px 6px #f3cfd3,4px 7px #0357d3,5px 7px #f3cfd3,4px 8px #0357d3,5px 8px #0357d3,6px 8px #f3cfd3,3px 9px #0357d3,4px 9px #0357d3,5px 9px #0357d3,6px 9px #0357d3,2px 10px #f3cfd3,3px 10px #f3cfd3,6px 10px #f3cfd3,7px 10px #f3cfd3}87.5%{box-shadow:4px 2px #038f03,5px 2px #038f03,3px 3px #038f03,4px 3px #038f03,5px 3px #f3cfd3,6px 3px #038f03,3px 4px #038f03,4px 4px #f3cfd3,5px 4px #f3cfd3,6px 4px #f3cfd3,4px 5px #f3cfd3,5px 5px #0357d3,4px 6px #f3cfd3,5px 6px #0357d3,4px 7px #0357d3,5px 7px #f3cfd3,4px 8px #0357d3,5px 8px #0357d3,2px 9px #f3cfd3,3px 9px #0357d3,4px 9px #0357d3,5px 9px #0357d3,6px 9px #0357d3,2px 10px #f3cfd3,5px 10px #f3cfd3,6px 10px #f3cfd3}100%{box-shadow:4px 2px #038f03,5px 2px #038f03,3px 3px #038f03,4px 3px #038f03,5px 3px #f3cfd3,6px 3px #038f03,3px 4px #038f03,4px 4px #f3cfd3,5px 4px #f3cfd3,6px 4px #f3cfd3,4px 5px #f3cfd3,5px 5px #0357d3,4px 6px #f3cfd3,5px 6px #0357d3,4px 7px #0357d3,5px 7px #f3cfd3,4px 8px #0357d3,5px 8px #0357d3,2px 9px #f3cfd3,3px 9px #0357d3,4px 9px #0357d3,5px 9px #0357d3,6px 9px #0357d3,2px 10px #f3cfd3,5px 10px #f3cfd3,6px 10px #f3cfd3}}\n.s2{width:8px;height:10px;--a:s2;--d:280ms}\n@keyframes s2{0%{box-shadow:4px 1px #038f03,5px 1px #038f03,3px 2px #038f03,4px 2px #038f03,5px 2px #f3cfd3,3px 3px #038f03,4px 3px #f3cfd3,5px 3px #f3cfd3,6px 3px #f3cfd3,2px 4px #f3cfd3,4px 4px #0357d3,5px 4px #0357d3,7px 4px #f3cfd3,3px 5px #f3cfd3,4px 5px #0357d3,5px 5px #0357d3,6px 5px #f3cfd3,4px 6px #0357d3,5px 6px #0357d3,4px 7px #0357d3,5px 7px #0357d3,2px 8px #f3cfd3,4px 8px #0357d3,5px 8px #0357d3,6px 8px #f3cfd3,3px 9px #f3cfd3,4px 9px #0357d3,7px 9px #f3cfd3}25%{box-shadow:3px 1px #038f03,5px 1px #038f03,3px 2px #038f03,4px 2px #038f03,5px 2px #f3cfd3,4px 3px #f3cfd3,5px 3px #f3cfd3,6px 3px #f3cfd3,4px 4px #0357d3,5px 4px #0357d3,2px 5px #f3cfd3,3px 5px #f3cfd3,4px 5px #0357d3,5px 5px #0357d3,6px 5px #f3cfd3,7px 5px #f3cfd3,4px 6px #0357d3,5px 6px #0357d3,4px 7px #0357d3,5px 7px #0357d3,4px 8px #0357d3,5px 8px #0357d3,6px 8px #f3cfd3,7px 8px #f3cfd3,2px 9px #f3cfd3,3px 9px #f3cfd3,4px 9px #0357d3}50%{box-shadow:4px 1px #038f03,5px 1px #038f03,3px 2px #038f03,4px 2px #038f03,5px 2px #f3cfd3,3px 3px #038f03,4px 3px #f3cfd3,5px 3px #f3cfd3,6px 3px #f3cfd3,4px 4px #0357d3,5px 4px #0357d3,3px 5px #f3cfd3,4px 5px #0357d3,5px 5px #0357d3,6px 5px #f3cfd3,2px 6px #f3cfd3,4px 6px #0357d3,5px 6px #0357d3,7px 6px #f3cfd3,4px 7px #0357d3,5px 7px #0357d3,7px 7px #f3cfd3,4px 8px #0357d3,5px 8px #0357d3,6px 8px #f3cfd3,3px 9px #f3cfd3,4px 9px #0357d3,2px 10px #f3cfd3}75%{box-shadow:3px 1px #038f03,5px 1px #038f03,3px 2px #038f03,4px 2px #038f03,5px 2px #f3cfd3,3px 3px #038f03,4px 3px #f3cfd3,5px 3px #f3cfd3,6px 3px #f3cfd3,4px 4px #0357d3,5px 4px #0357d3,2px 5px #f3cfd3,3px 5px #f3cfd3,4px 5px #0357d3,5px 5px #0357d3,6px 5px #f3cfd3,7px 5px #f3cfd3,4px 6px #0357d3,5px 6px #0357d3,4px 7px #0357d3,5px 7px #0357d3,2px 8px #f3cfd3,3px 8px #f3cfd3,4px 8px #0357d3,5px 8px #0357d3,6px 8px #f3cfd3,7px 8px #f3cfd3,4px 9px #0357d3}100%{box-shadow:3px 1px #038f03,5px 1px #038f03,3px 2px #038f03,4px 2px #038f03,5px 2px #f3cfd3,3px 3px #038f03,4px 3px #f3cfd3,5px 3px #f3cfd3,6px 3px #f3cfd3,4px 4px #0357d3,5px 4px #0357d3,2px 5px #f3cfd3,3px 5px #f3cfd3,4px 5px #0357d3,5px 5px #0357d3,6px 5px #f3cfd3,7px 5px #f3cfd3,4px 6px #0357d3,5px 6px #0357d3,4px 7px #0357d3,5px 7px #0357d3,2px 8px #f3cfd3,3px 8px #f3cfd3,4px 8px #0357d3,5px 8px #0357d3,6px 8px #f3cfd3,7px 8px #f3cfd3,4px 9px #0357d3}}";
  const NEW = {"floater":{"width":12,"height":18,"frameMs":280,"frames":[[[5,0,"#713b38"],[6,0,"#713b38"],[3,1,"#713b38"],[4,1,"#713b38"],[5,1,"#f2bb4e"],[6,1,"#f2bb4e"],[7,1,"#713b38"],[8,1,"#713b38"],[2,2,"#713b38"],[3,2,"#df654d"],[4,2,"#df654d"],[5,2,"#f2bb4e"],[6,2,"#f2bb4e"],[7,2,"#df654d"],[8,2,"#df654d"],[9,2,"#713b38"],[1,3,"#713b38"],[2,3,"#df654d"],[3,3,"#df654d"],[4,3,"#df654d"],[5,3,"#f2bb4e"],[6,3,"#f2bb4e"],[7,3,"#df654d"],[8,3,"#df654d"],[9,3,"#df654d"],[10,3,"#713b38"],[1,4,"#713b38"],[2,4,"#713b38"],[3,4,"#713b38"],[4,4,"#df654d"],[5,4,"#713b38"],[6,4,"#713b38"],[7,4,"#713b38"],[8,4,"#df654d"],[9,4,"#713b38"],[10,4,"#713b38"],[6,5,"#713b38"],[6,6,"#713b38"],[6,7,"#f3cfd3"],[7,7,"#f3cfd3"],[4,8,"#038f03"],[5,8,"#038f03"],[8,8,"#f3cfd3"],[4,9,"#038f03"],[5,9,"#038f03"],[6,9,"#038f03"],[8,9,"#f3cfd3"],[4,10,"#038f03"],[5,10,"#038f03"],[6,10,"#f3cfd3"],[8,10,"#f3cfd3"],[5,11,"#f3cfd3"],[6,11,"#f3cfd3"],[7,11,"#f3cfd3"],[8,11,"#f3cfd3"],[4,12,"#f3cfd3"],[5,12,"#0357d3"],[6,12,"#0357d3"],[8,12,"#f3cfd3"],[4,13,"#f3cfd3"],[5,13,"#0357d3"],[6,13,"#0357d3"],[7,13,"#f3cfd3"],[4,14,"#f3cfd3"],[5,14,"#0357d3"],[6,14,"#0357d3"],[3,15,"#f3cfd3"],[5,15,"#0357d3"],[6,15,"#0357d3"],[5,16,"#0357d3"],[6,16,"#0357d3"],[5,17,"#f3cfd3"],[6,17,"#f3cfd3"]],[[4,0,"#713b38"],[5,0,"#713b38"],[2,1,"#713b38"],[3,1,"#713b38"],[4,1,"#f2bb4e"],[5,1,"#f2bb4e"],[6,1,"#713b38"],[7,1,"#713b38"],[1,2,"#713b38"],[2,2,"#df654d"],[3,2,"#df654d"],[4,2,"#f2bb4e"],[5,2,"#f2bb4e"],[6,2,"#df654d"],[7,2,"#df654d"],[8,2,"#713b38"],[0,3,"#713b38"],[1,3,"#df654d"],[2,3,"#df654d"],[3,3,"#df654d"],[4,3,"#f2bb4e"],[5,3,"#f2bb4e"],[6,3,"#df654d"],[7,3,"#df654d"],[8,3,"#df654d"],[9,3,"#713b38"],[0,4,"#713b38"],[1,4,"#713b38"],[2,4,"#713b38"],[3,4,"#df654d"],[4,4,"#713b38"],[5,4,"#713b38"],[6,4,"#713b38"],[7,4,"#df654d"],[8,4,"#713b38"],[9,4,"#713b38"],[5,5,"#713b38"],[5,6,"#713b38"],[5,7,"#f3cfd3"],[6,7,"#f3cfd3"],[4,8,"#038f03"],[5,8,"#038f03"],[7,8,"#f3cfd3"],[4,9,"#038f03"],[5,9,"#038f03"],[6,9,"#038f03"],[8,9,"#f3cfd3"],[4,10,"#038f03"],[5,10,"#038f03"],[6,10,"#f3cfd3"],[8,10,"#f3cfd3"],[5,11,"#f3cfd3"],[6,11,"#f3cfd3"],[7,11,"#f3cfd3"],[8,11,"#f3cfd3"],[4,12,"#f3cfd3"],[5,12,"#0357d3"],[6,12,"#0357d3"],[8,12,"#f3cfd3"],[4,13,"#f3cfd3"],[5,13,"#0357d3"],[6,13,"#0357d3"],[7,13,"#f3cfd3"],[4,14,"#f3cfd3"],[5,14,"#0357d3"],[6,14,"#0357d3"],[4,15,"#f3cfd3"],[5,15,"#0357d3"],[6,15,"#0357d3"],[5,16,"#f3cfd3"],[6,16,"#0357d3"],[4,17,"#f3cfd3"],[6,17,"#f3cfd3"]],[[5,0,"#713b38"],[6,0,"#713b38"],[3,1,"#713b38"],[4,1,"#713b38"],[5,1,"#f2bb4e"],[6,1,"#f2bb4e"],[7,1,"#713b38"],[8,1,"#713b38"],[2,2,"#713b38"],[3,2,"#df654d"],[4,2,"#df654d"],[5,2,"#f2bb4e"],[6,2,"#f2bb4e"],[7,2,"#df654d"],[8,2,"#df654d"],[9,2,"#713b38"],[1,3,"#713b38"],[2,3,"#df654d"],[3,3,"#df654d"],[4,3,"#df654d"],[5,3,"#f2bb4e"],[6,3,"#f2bb4e"],[7,3,"#df654d"],[8,3,"#df654d"],[9,3,"#df654d"],[10,3,"#713b38"],[1,4,"#713b38"],[2,4,"#713b38"],[3,4,"#713b38"],[4,4,"#df654d"],[5,4,"#713b38"],[6,4,"#713b38"],[7,4,"#713b38"],[8,4,"#df654d"],[9,4,"#713b38"],[10,4,"#713b38"],[6,5,"#713b38"],[6,6,"#713b38"],[6,7,"#f3cfd3"],[7,7,"#f3cfd3"],[5,8,"#038f03"],[6,8,"#038f03"],[8,8,"#f3cfd3"],[4,9,"#038f03"],[5,9,"#038f03"],[6,9,"#038f03"],[8,9,"#f3cfd3"],[4,10,"#038f03"],[5,10,"#038f03"],[6,10,"#f3cfd3"],[8,10,"#f3cfd3"],[5,11,"#f3cfd3"],[6,11,"#f3cfd3"],[7,11,"#f3cfd3"],[8,11,"#f3cfd3"],[4,12,"#f3cfd3"],[5,12,"#0357d3"],[6,12,"#0357d3"],[8,12,"#f3cfd3"],[4,13,"#f3cfd3"],[5,13,"#0357d3"],[6,13,"#0357d3"],[7,13,"#f3cfd3"],[4,14,"#f3cfd3"],[5,14,"#0357d3"],[6,14,"#0357d3"],[4,15,"#f3cfd3"],[5,15,"#0357d3"],[6,15,"#0357d3"],[5,16,"#0357d3"],[6,16,"#0357d3"],[5,17,"#f3cfd3"],[6,17,"#f3cfd3"]],[[6,0,"#713b38"],[7,0,"#713b38"],[4,1,"#713b38"],[5,1,"#713b38"],[6,1,"#f2bb4e"],[7,1,"#f2bb4e"],[8,1,"#713b38"],[9,1,"#713b38"],[3,2,"#713b38"],[4,2,"#df654d"],[5,2,"#df654d"],[6,2,"#f2bb4e"],[7,2,"#f2bb4e"],[8,2,"#df654d"],[9,2,"#df654d"],[10,2,"#713b38"],[2,3,"#713b38"],[3,3,"#df654d"],[4,3,"#df654d"],[5,3,"#df654d"],[6,3,"#f2bb4e"],[7,3,"#f2bb4e"],[8,3,"#df654d"],[9,3,"#df654d"],[10,3,"#df654d"],[11,3,"#713b38"],[2,4,"#713b38"],[3,4,"#713b38"],[4,4,"#713b38"],[5,4,"#df654d"],[6,4,"#713b38"],[7,4,"#713b38"],[8,4,"#713b38"],[9,4,"#df654d"],[10,4,"#713b38"],[11,4,"#713b38"],[7,5,"#713b38"],[7,6,"#713b38"],[7,7,"#f3cfd3"],[8,7,"#f3cfd3"],[4,8,"#038f03"],[5,8,"#038f03"],[9,8,"#f3cfd3"],[4,9,"#038f03"],[5,9,"#038f03"],[6,9,"#038f03"],[8,9,"#f3cfd3"],[4,10,"#038f03"],[5,10,"#038f03"],[6,10,"#f3cfd3"],[8,10,"#f3cfd3"],[5,11,"#f3cfd3"],[6,11,"#f3cfd3"],[7,11,"#f3cfd3"],[8,11,"#f3cfd3"],[4,12,"#f3cfd3"],[5,12,"#0357d3"],[6,12,"#0357d3"],[8,12,"#f3cfd3"],[4,13,"#f3cfd3"],[5,13,"#0357d3"],[6,13,"#0357d3"],[7,13,"#f3cfd3"],[3,14,"#f3cfd3"],[5,14,"#0357d3"],[6,14,"#0357d3"],[2,15,"#f3cfd3"],[5,15,"#0357d3"],[6,15,"#0357d3"],[5,16,"#0357d3"],[6,16,"#f3cfd3"],[5,17,"#f3cfd3"],[7,17,"#f3cfd3"]]],"bodyX":2},"blocker":{"width":8,"height":10,"frameMs":650,"frames":[[[3,0,"#038f03"],[4,0,"#038f03"],[2,1,"#038f03"],[3,1,"#038f03"],[4,1,"#038f03"],[5,1,"#038f03"],[2,2,"#038f03"],[3,2,"#f3cfd3"],[4,2,"#f3cfd3"],[5,2,"#038f03"],[3,3,"#f3cfd3"],[4,3,"#f3cfd3"],[0,4,"#f3cfd3"],[1,4,"#f3cfd3"],[2,4,"#f3cfd3"],[3,4,"#0357d3"],[4,4,"#0357d3"],[5,4,"#f3cfd3"],[6,4,"#f3cfd3"],[7,4,"#f3cfd3"],[3,5,"#0357d3"],[4,5,"#0357d3"],[3,6,"#0357d3"],[4,6,"#0357d3"],[2,7,"#0357d3"],[3,7,"#0357d3"],[4,7,"#0357d3"],[5,7,"#0357d3"],[2,8,"#0357d3"],[5,8,"#0357d3"],[1,9,"#f3cfd3"],[2,9,"#f3cfd3"],[5,9,"#f3cfd3"],[6,9,"#f3cfd3"]],[[2,0,"#038f03"],[4,0,"#038f03"],[2,1,"#038f03"],[3,1,"#038f03"],[4,1,"#038f03"],[5,1,"#038f03"],[2,2,"#038f03"],[3,2,"#f3cfd3"],[4,2,"#f3cfd3"],[5,2,"#038f03"],[3,3,"#f3cfd3"],[4,3,"#f3cfd3"],[0,4,"#f3cfd3"],[1,4,"#f3cfd3"],[2,4,"#f3cfd3"],[3,4,"#0357d3"],[4,4,"#0357d3"],[5,4,"#f3cfd3"],[6,4,"#f3cfd3"],[7,4,"#f3cfd3"],[3,5,"#0357d3"],[4,5,"#0357d3"],[3,6,"#0357d3"],[4,6,"#0357d3"],[2,7,"#0357d3"],[3,7,"#0357d3"],[4,7,"#0357d3"],[5,7,"#0357d3"],[2,8,"#0357d3"],[5,8,"#0357d3"],[1,9,"#f3cfd3"],[2,9,"#f3cfd3"],[5,9,"#f3cfd3"],[6,9,"#f3cfd3"]]]}};   // extra sprites: {name: {width, height, bodyX, frameMs, frames: [[[x, y, colour], ...], ...]}}

  const S = 4;           // screen px per sprite px
  const FRAME_MS = 70;   // one sprite frame
  const WALK = 1;        // px per frame
  const MAX_STEP = 2;    // a ledge this high or lower is stepped up; higher is a wall
  const MAX_DROP = 3;    // a drop this deep or shallower is stepped down; deeper is a fall
  const BODY_L = 3, BODY_R = 2, BODY_H = 10;   // body spans fx-3..fx+2, 10 rows tall
  const GRAVITY = 0.5;   // px per frame²
  const MAX_V = 12;      // px per frame
  const FLOAT_V = 0.6;   // fall speed under an umbrella
  const HOP_V = -3;      // a click nearby makes walkers hop this hard
  const PAD_POWER = 0.2;
  const SOLID_TAGS = new Set(['IMG', 'VIDEO', 'CANVAS', 'svg', 'INPUT', 'BUTTON', 'TEXTAREA', 'SELECT', 'IFRAME', 'HR']);

  // Extra sprites become CSS keyframes like s1/s2; each frame repeats so it lasts frameMs.
  const meta = { s1: { bodyX: 0 }, s2: { bodyX: 0 } };
  let extraCss = '';
  for (const [name, sp] of Object.entries(NEW)) {
    const reps = Math.max(1, Math.round((sp.frameMs || FRAME_MS) / FRAME_MS));
    const frames = sp.frames.flatMap(f => Array(reps).fill(f));
    const shadow = f => f.map(([x, y, c]) => `${x + 1}px ${y + 1}px ${c}`).join(',');
    const kf = frames.map((f, i) => `${(i * 100 / frames.length).toFixed(4)}%{box-shadow:${shadow(f)}}`).join('');
    extraCss += `.${name}{width:${sp.width}px;height:${sp.height}px;--a:${name};--d:${frames.length * FRAME_MS}ms}` +
      `@keyframes ${name}{${kf}100%{box-shadow:${shadow(frames.at(-1))}}}`;
    meta[name] = { bodyX: sp.bodyX || 0 };
  }

  const host = document.createElement('div');
  host.id = 'lemmings';
  host.setAttribute('aria-hidden', 'true');
  host.style.cssText = 'position:absolute;left:0;top:0;width:0;height:0;z-index:50';   // under sticky headers and overlays
  const root = host.attachShadow({ mode: 'open' });
  const sheet = new CSSStyleSheet();
  const O = devicePixelRatio >= 2 ? 0.5 : 1, OC = '#999';
  sheet.replaceSync(CSS + extraCss + `
.sprite{position:absolute;left:0;top:0;transform-origin:0 0;cursor:grab;touch-action:none;user-select:none}
.wrap{position:absolute;left:0;top:0;transition:opacity .5s}
.wrap.gone{opacity:0}
.outline{filter:drop-shadow(${O}px 0 0 ${OC}) drop-shadow(-${O}px 0 0 ${OC}) drop-shadow(0 ${O}px 0 ${OC}) drop-shadow(0 -${O}px 0 ${OC})}`);
  root.adoptedStyleSheets = [sheet];

  let rects = [], exits = [], WW = 0, home = 0, timer = 0;
  let wide = !SCOPE;   // measure the whole page? Only once a reader has picked a walker up (it is costlier)
  const walkers = [];
  const floorY = () => Math.floor((PAGE_FLOOR ? document.documentElement.scrollHeight
    : scrollY + document.documentElement.clientHeight) / S);
  const clampV = v => Math.max(-MAX_V, Math.min(MAX_V, v));
  const clampX = x => Math.min(Math.max(x, 1 + BODY_L), WW - 1 - BODY_R);
  // zero alpha only: rgba(r, g, b, 0) or "... / 0)"; an opaque rgb(230, 81, 0) is not transparent
  const transparent = c => c === 'transparent' || /^rgba\(([^,]*,){3}\s*0(\.0+)?\)$/.test(c) || /\/\s*0(\.0+)?\)$/.test(c);
  const emit = () => document.dispatchEvent(new CustomEvent('lemmings:change', { detail: { out: walkers.length, home } }));

  // With data-scope, falling walkers move with the scope element (the footer) when the page above it grows,
  // e.g. lazy images loading after a reader jumps to the end; otherwise they would fall through the post.
  let scopeTop = null;
  const scopeY = () => { const e = SCOPE && document.querySelector(SCOPE); return e ? (e.getBoundingClientRect().top + scrollY) / S : null; };

  function buildRects() {
    const before = scopeTop;
    scopeTop = scopeY();
    if (before !== null && scopeTop !== null && scopeTop !== before) {
      for (const w of walkers) if (w.state === 'air' && !w.free) w.y += scopeTop - before;
    }
    const sx = scrollX, sy = scrollY, vpArea = innerWidth * innerHeight, out = [];
    const world = (l, t, r, b) => ({ x: Math.floor((l + sx) / S), y: Math.floor((t + sy) / S), x2: Math.ceil((r + sx) / S), y2: Math.ceil((b + sy) / S) });
    // inScope: inside the data-scope element. Walkers nobody has picked up only ever see those surfaces.
    const scopeEls = SCOPE ? [...document.querySelectorAll(SCOPE)] : [];
    let inScope = true;
    const add = (src, part, l, t, r, b, floor) => {
      if (r > l && b > t) out.push({ src, part, ...world(l, t, r, b), floor, inScope });
    };
    const scopes = wide ? [document.body] : scopeEls;
    for (const sc of scopes) {
      for (const n of [sc, ...sc.querySelectorAll('*')]) {
        if (n.closest(EXIT)) continue;   // exits never block: walkers go in
        inScope = !SCOPE || scopeEls.some(e => e.contains(n));
        const b = n.getBoundingClientRect();
        if (!b.width || !b.height) continue;
        const cs = getComputedStyle(n);
        if (cs.visibility !== 'visible' || cs.opacity === '0') continue;
        if (SOLID_TAGS.has(n.tagName)) { add(n, 'box', b.left, b.top, b.right, b.bottom); continue; }
        if ((!transparent(cs.backgroundColor) || cs.backgroundImage !== 'none') && b.width * b.height < vpArea / 2) {
          add(n, 'box', b.left, b.top, b.right, b.bottom); continue;
        }
        const bw = side => {
          const st = cs[`border${side}Style`];
          return st !== 'none' && st !== 'hidden' && !transparent(cs[`border${side}Color`]) ? parseFloat(cs[`border${side}Width`]) : 0;
        };
        const t = bw('Top'), r = bw('Right'), bo = bw('Bottom'), l = bw('Left');
        if (t) add(n, 't', b.left, b.top, b.right, b.top + t);
        if (bo) add(n, 'b', b.left, b.bottom - bo, b.right, b.bottom);
        if (l) add(n, 'l', b.left, b.top, b.left + l, b.bottom);
        if (r) add(n, 'r', b.right - r, b.top, b.right, b.bottom);
      }
      const tw = document.createTreeWalker(sc, NodeFilter.SHOW_TEXT, {
        acceptNode: t => /\S/.test(t.data) && !/^(SCRIPT|STYLE|NOSCRIPT|TEXTAREA)$/.test(t.parentElement?.tagName)
          ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP,
      });
      const range = document.createRange();
      for (let t; (t = tw.nextNode());) {
        inScope = !SCOPE || scopeEls.some(e => e.contains(t));
        range.selectNodeContents(t);
        let line = 0;
        for (const q of range.getClientRects()) add(t, line++, q.left, q.top, q.right, q.bottom, true);
      }
    }
    rects = out;
    exits = [...document.querySelectorAll(EXIT)].map(e => e.getBoundingClientRect())
      .filter(b => b.width && b.height).map(b => world(b.left, b.top, b.right, b.bottom));
    // 4px short of the right edge, so even the umbrella sprite never pokes past the page and adds a scrollbar
    // (mirrored, a sprite's 1px ::before anchor box lands 1px past its right side)
    WW = Math.floor(document.documentElement.clientWidth / S) - 4;
  }

  let scoped = false;   // set per walker in step(): true for walkers nobody has picked up (scope surfaces only)
  const hit = (px, py, floorToo) =>
    rects.find(r => (floorToo || !r.floor) && (!scoped || r.inScope) && px >= r.x && px < r.x2 && py >= r.y && py < r.y2);
  const solid = (px, py, floorToo) => px < 1 || px >= WW || py >= floorY() || !!hit(px, py, floorToo);
  const ground = (px, py) => solid(px, py, true);

  function launch(w, vx, vy) {
    w.state = 'air';
    w.vx = vx;
    w.vy = vy;
    if (vx) w.dir = Math.sign(vx);
    w.anchor = null;
    play(w, 's2');
  }

  function carry(w, dx, dy, ms) {
    w.fx += dx; w.y += dy;
    if (dy < -2 || Math.abs(dx) > 2) {
      const k = FRAME_MS / Math.max(16, ms), p = Math.sqrt(PAD_POWER), vx = clampV(dx * k) * p;
      launch(w, vx, Math.min(clampV(dy * k) * p, -Math.abs(vx) / 2));
    }
  }

  let pending = 0, burstStart = 0, idle = false;
  function rebuild() {
    pending = 0;
    if (idle) return;   // paused: anchors are kept and carried on resume
    buildRects();
    for (const w of walkers) {
      const a = (w.state === 'walk' || w.state === 'block') && w.anchor !== 'floor' && w.anchor;
      if (a) {
        const nr = rects.find(r => r.src === a.src && r.part === a.part);
        w.anchor = nr || null;
        if (nr) carry(w, nr.x - a.x, nr.y - a.y, performance.now() - burstStart);
      }
      if (w.state !== 'held') { w.fx = clampX(w.fx); draw(w); }
    }
  }
  const rebuildSoon = delay => {
    if (pending || !walkers.length || idle) return;
    burstStart = performance.now();
    pending = setTimeout(rebuild, delay);
  };

  let lastFloor = 0, lastFloorT = 0;
  function floorMoved() {
    const f = floorY(), now = performance.now(), dy = f - lastFloor, ms = now - lastFloorT;
    lastFloor = f; lastFloorT = now;
    if (dy) for (const w of walkers) {
      if ((w.state !== 'walk' && w.state !== 'block') || w.anchor !== 'floor') continue;
      if (dy < 0) carry(w, 0, dy, ms); else launch(w, 0, 0);
      draw(w);
    }
  }

  function lightBehind(cx, cy) {
    for (const n of document.elementsFromPoint(cx, cy)) {
      if (n === host) continue;
      const cs = getComputedStyle(n);
      if (cs.backgroundImage !== 'none') return false;
      if (transparent(cs.backgroundColor)) continue;
      const m = cs.backgroundColor.match(/^rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)/);
      return !!m && 0.2126 * m[1] + 0.7152 * m[2] + 0.0722 * m[3] > 200;
    }
    return true;
  }

  // --- the reader: a click near a walker makes it hop
  addEventListener('pointerdown', e => {
    if (e.composedPath().includes(host)) return;
    const x = e.clientX + scrollX, y = e.clientY + scrollY;
    for (const w of walkers) {
      if (w.state === 'walk' && Math.hypot(x - w.fx * S, y - (w.y - BODY_H / 2) * S) < 90) launch(w, 0, HOP_V);
    }
  }, { passive: true, capture: true });

  // w.fx = feet centre x, w.y = ground row (first row under the feet), w.dir = 1 right / -1 left
  function spawn(at) {
    const wrap = document.createElement('div');
    wrap.className = 'wrap';
    const el = document.createElement('i');
    wrap.append(el);
    root.append(wrap);
    const n = walkers.length;
    const w = {
      el, wrap, dir: n % 2 ? -1 : 1, umbrella: false,
      fx: at ? Math.round(at.x / S) : Math.round((scrollX + innerWidth / 2) / S) + (n % 7 - 3) * 12,
      y: at ? Math.round(at.y / S) : Math.round(scrollY / S) + 12,
    };
    w.fx = clampX(w.fx);   // never start past the page edges
    launch(w, 0, 0);

    // A quick tap gives a job; press and move (or hold) picks the walker up.
    let trail = [], press = null;
    const hold = e => {
      const x = e.clientX + scrollX, last = trail.at(-1);
      if (last && Math.abs(x - last.x) >= 2) w.dir = Math.sign(x - last.x);
      trail = [...trail.filter(p => e.timeStamp - p.t <= 100), { t: e.timeStamp, x, y: e.clientY + scrollY }];
      w.fx = clampX(Math.round(x / S));
      w.y = Math.round((e.clientY + scrollY) / S) + BODY_H - 2;   // hang from the cursor by the head
      draw(w);
    };
    const grab = e => {
      w.state = 'held'; w.umbrella = false; play(w, 's2');
      w.free = true;   // picked up: it now lands on whatever is on the page
      if (!wide) { wide = true; idle = false; clearTimeout(pending); rebuild(); }   // rebuild() also carries the others along
      trail = [];
      hold(e);
    };
    el.addEventListener('pointerdown', e => {
      if (w.state === 'gone') return;
      e.preventDefault();
      el.setPointerCapture(e.pointerId);
      press = { x: e.clientX, y: e.clientY, t: e.timeStamp };
    });
    el.addEventListener('pointermove', e => {
      if (w.state === 'held') return hold(e);
      if (press && (Math.hypot(e.clientX - press.x, e.clientY - press.y) > 5 || e.timeStamp - press.t > 300)) grab(e);
    });
    const release = e => {
      const p = press;
      press = null;
      if (w.state !== 'held') {
        if (p && e.type === 'pointerup' && e.timeStamp - p.t < 400) tap(w);
        return;
      }
      const pts = trail.filter(q => e.timeStamp - q.t <= 100), a = pts[0], b = pts.at(-1);
      const k = a && b.t > a.t ? FRAME_MS / S / (b.t - a.t) : 0;
      launch(w, k && clampV((b.x - a.x) * k), k && clampV((b.y - a.y) * k));
    };
    el.addEventListener('pointerup', release);
    el.addEventListener('pointercancel', release);

    walkers.push(w);
    draw(w);
    emit();
    if (!timer) {
      lastFloor = floorY(); lastFloorT = performance.now();
      timer = setInterval(tick, FRAME_MS);
    }
  }

  // Tap: a walker becomes a blocker and back; a falling walker opens or closes its umbrella.
  function tap(w) {
    if (w.state === 'walk') { w.state = 'block'; play(w, 'blocker'); }
    else if (w.state === 'block') { w.state = 'walk'; play(w, 's1'); }
    else if (w.state === 'air') w.umbrella = !w.umbrella;
    draw(w);
  }

  function goHome(w, exit) {
    w.state = 'gone';
    w.fx = Math.round((exit.x + exit.x2) / 2);
    w.wrap.classList.add('gone');
    walkers.splice(walkers.indexOf(w), 1);
    home++;
    emit();
    draw(w);
    setTimeout(() => w.wrap.remove(), 600);
  }

  function play(w, name) {
    if (w.el.classList.contains(name) && w.anim) return;
    w.el.className = 'sprite ' + name;
    w.sprite = name;
    w.anim = w.el.getAnimations({ subtree: true })[0];
    w.anim.pause();
    w.frames = Math.round(w.anim.effect.getComputedTiming().duration / FRAME_MS);
    w.frame = 0;
  }

  // A blocker ahead of w, overlapping the column w's front edge moves into
  const blockerAhead = (w, front) => walkers.some(o => o !== w && o.state === 'block' &&
    front >= o.fx - BODY_L && front <= o.fx + BODY_R && Math.abs(o.y - w.y) < BODY_H &&
    (w.dir > 0 ? w.fx < o.fx : w.fx > o.fx));

  // Settle onto the ground under the feet, or start falling
  function settle(w) {
    let down = 0;
    while (down <= MAX_DROP && !ground(w.fx, w.y + down)) down++;
    if (down > MAX_DROP) { launch(w, 0, 0); return false; }
    w.y += down;
    w.anchor = hit(w.fx, w.y, true) || (w.y >= floorY() ? 'floor' : null);
    return true;
  }

  function step(w) {
    if (w.state === 'held' || w.state === 'gone') return;
    scoped = !!SCOPE && !w.free;
    for (let k = 0; k < 100 && solid(w.fx, w.y - 1); k++) w.y--;
    if (w.state === 'block') {
      settle(w);
    } else if (w.state === 'walk') {
      play(w, 's1');
      const nx = w.fx + w.dir * WALK;
      let up = 0;
      while (up <= MAX_STEP && solid(nx, w.y - 1 - up)) up++;
      const front = nx + (w.dir > 0 ? BODY_R : -BODY_L);
      let wall = blockerAhead(w, front);
      for (let r = w.y - 1 - MAX_STEP; r >= w.y - BODY_H; r--) wall ||= solid(front, r);
      if (wall || up > MAX_STEP) w.dir = -w.dir; else { w.fx = nx; w.y -= up; }
      if (settle(w)) {
        const ex = exits.find(e => w.fx >= e.x && w.fx < e.x2 && w.y >= e.y - 1 && w.y <= e.y2 + 1);
        if (ex) return goHome(w, ex);
      }
    } else {
      w.vy = Math.min(w.vy + GRAVITY, MAX_V);
      if (w.umbrella && w.vy > 0) { w.vy = Math.min(w.vy, FLOAT_V); w.vx *= 0.9; }
      play(w, w.umbrella && w.vy > 0 ? 'floater' : 's2');
      const n = Math.ceil(Math.max(Math.abs(w.vx), Math.abs(w.vy), 1));
      for (let i = 0; i < n; i++) {
        const px = Math.round(w.fx), py = Math.round(w.y);
        if (w.vy >= 0 && ground(px, py)) {   // landed: note the surface now, so a rebuild before the next step carries it
          w.fx = px; w.y = py; w.state = 'walk'; w.umbrella = false; play(w, 's1');
          w.anchor = hit(px, py, true) || (py >= floorY() ? 'floor' : null);
          break;
        }
        const nx = w.fx + w.vx / n, ny = w.y + w.vy / n, qx = Math.round(nx), qy = Math.round(ny);
        if (w.vx && solid(qx + (w.vx > 0 ? BODY_R : -BODY_L), qy - (BODY_H >> 1))) { w.vx = -w.vx / 2; w.dir = -w.dir; continue; }
        if (w.vy < 0 && solid(qx, qy - BODY_H)) { w.vy = 0; continue; }
        w.fx = nx; w.y = ny;
      }
      w.fx = clampX(w.fx);   // fractional drift must not carry a sprite past the page edge
    }
    w.frame = (w.frame + 1) % w.frames;
    w.anim.currentTime = w.frame * FRAME_MS + 1;
    draw(w);
  }

  function draw(w) {
    const { el, fx, y } = w, wd = el.offsetWidth, h = el.offsetHeight, bx = 4 + (meta[w.sprite]?.bodyX || 0);
    const left = w.dir < 0 ? fx - (wd - bx) : fx - bx;
    el.style.transform = `translate(${left * S}px,${(y - h) * S}px) scale(${S})` +
      (w.dir < 0 ? ` translateX(${wd}px) scaleX(-1)` : '');
    w.wrap.dataset.state = w.state;
    w.wrap.classList.toggle('outline', lightBehind(fx * S - scrollX, (y - BODY_H / 2) * S - scrollY));
  }

  // Standing walkers more than a screen away from the view (or in a hidden tab) are frozen: no stepping, no
  // rebuilds. A walker counts as near if it, or the surface it stands on, is near the view (the page may have
  // moved that surface while it was frozen), or if it is in the air. Coming back, surfaces are re-measured and
  // anchored walkers carried along to where their surface now is.
  const near = (top, bottom) => bottom > scrollY - innerHeight && top < scrollY + 2 * innerHeight;
  const active = w => {
    if (w.state !== 'walk' && w.state !== 'block') return true;
    if (near((w.y - BODY_H) * S, w.y * S)) return true;
    const a = w.anchor;
    if (a === 'floor') return near(floorY() * S - 1, floorY() * S);
    const n = a && (a.src.nodeType === 1 ? a.src : a.src.parentElement);
    if (!n || !n.isConnected) return true;
    const r = n.getBoundingClientRect();
    return near(r.top + scrollY, r.bottom + scrollY);
  };
  function tick() {
    if (!walkers.length) { clearInterval(timer); timer = 0; return; }
    if (document.hidden || !walkers.some(active)) { idle = true; clearTimeout(pending); pending = 0; return; }
    if (idle) { idle = false; clearTimeout(pending); rebuild(); }
    floorMoved();
    walkers.slice().forEach(step);
  }

  // Reduced motion switched on mid-visit: everything goes away for good.
  let stopped = false;
  function stopAll() {
    stopped = true;
    clearInterval(timer); timer = 0;
    clearTimeout(pending);
    walkers.length = 0;
    host.remove();
    emit();
  }

  function start() {
    matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', e => { if (e.matches) stopAll(); });
    document.documentElement.append(host);
    buildRects();
    addEventListener('resize', () => { if (walkers.length) { floorMoved(); rebuildSoon(100); } });
    addEventListener('scroll', () => { if (walkers.length) { floorMoved(); rebuildSoon(300); } }, { passive: true });
    new MutationObserver(() => rebuildSoon(300)).observe(document.body, { subtree: true, childList: true, attributes: true, characterData: true });
    new ResizeObserver(() => rebuildSoon(100)).observe(document.body);   // images loading change layout without mutations
    const count = parseInt(cfg.count || '0', 10), target = cfg.spawn && document.querySelector(cfg.spawn);
    for (let i = 0; i < count; i++) {
      if (!target) { spawn(); continue; }
      const b = target.getBoundingClientRect();
      spawn({ x: b.left + scrollX + b.width * (0.1 + 0.8 * (i + 0.5) / count), y: b.top + scrollY - 10 });
    }
    if (!count) emit();
  }

  const ready = f => document.body ? f() : addEventListener('DOMContentLoaded', f, { once: true });
  let started = false;
  window.lemmings = {
    add: at => ready(() => { if (stopped) return; if (!started) { started = true; start(); } buildRects(); spawn(at); }),
    doorSVG: "<svg viewBox=\"0 0 12 16\" width=\"48\" height=\"64\" shape-rendering=\"crispEdges\" aria-hidden=\"true\"><g class=\"lemming-door-a\"><rect x=\"4\" y=\"0\" width=\"4\" height=\"1\" fill=\"#514750\"/><rect x=\"2\" y=\"1\" width=\"2\" height=\"1\" fill=\"#514750\"/><rect x=\"4\" y=\"1\" width=\"2\" height=\"1\" fill=\"#d6b79b\"/><rect x=\"6\" y=\"1\" width=\"2\" height=\"1\" fill=\"#9c8581\"/><rect x=\"8\" y=\"1\" width=\"2\" height=\"1\" fill=\"#514750\"/><rect x=\"1\" y=\"2\" width=\"1\" height=\"1\" fill=\"#514750\"/><rect x=\"2\" y=\"2\" width=\"2\" height=\"1\" fill=\"#d6b79b\"/><rect x=\"4\" y=\"2\" width=\"1\" height=\"1\" fill=\"#f9d993\"/><rect x=\"5\" y=\"2\" width=\"2\" height=\"1\" fill=\"#edb360\"/><rect x=\"7\" y=\"2\" width=\"1\" height=\"1\" fill=\"#f9d993\"/><rect x=\"8\" y=\"2\" width=\"1\" height=\"1\" fill=\"#d6b79b\"/><rect x=\"9\" y=\"2\" width=\"1\" height=\"1\" fill=\"#9c8581\"/><rect x=\"10\" y=\"2\" width=\"1\" height=\"1\" fill=\"#514750\"/><rect x=\"0\" y=\"3\" width=\"1\" height=\"1\" fill=\"#514750\"/><rect x=\"1\" y=\"3\" width=\"1\" height=\"1\" fill=\"#d6b79b\"/><rect x=\"2\" y=\"3\" width=\"1\" height=\"1\" fill=\"#9c8581\"/><rect x=\"3\" y=\"3\" width=\"1\" height=\"1\" fill=\"#514750\"/><rect x=\"4\" y=\"3\" width=\"4\" height=\"1\" fill=\"#302c3e\"/><rect x=\"8\" y=\"3\" width=\"1\" height=\"1\" fill=\"#514750\"/><rect x=\"9\" y=\"3\" width=\"1\" height=\"1\" fill=\"#9c8581\"/><rect x=\"10\" y=\"3\" width=\"1\" height=\"1\" fill=\"#d6b79b\"/><rect x=\"11\" y=\"3\" width=\"1\" height=\"1\" fill=\"#514750\"/><rect x=\"0\" y=\"4\" width=\"1\" height=\"1\" fill=\"#514750\"/><rect x=\"1\" y=\"4\" width=\"1\" height=\"1\" fill=\"#9c8581\"/><rect x=\"2\" y=\"4\" width=\"1\" height=\"1\" fill=\"#514750\"/><rect x=\"3\" y=\"4\" width=\"6\" height=\"1\" fill=\"#302c3e\"/><rect x=\"9\" y=\"4\" width=\"1\" height=\"1\" fill=\"#514750\"/><rect x=\"10\" y=\"4\" width=\"1\" height=\"1\" fill=\"#9c8581\"/><rect x=\"11\" y=\"4\" width=\"1\" height=\"1\" fill=\"#514750\"/><rect x=\"0\" y=\"5\" width=\"1\" height=\"1\" fill=\"#514750\"/><rect x=\"1\" y=\"5\" width=\"1\" height=\"1\" fill=\"#d6b79b\"/><rect x=\"2\" y=\"5\" width=\"8\" height=\"1\" fill=\"#302c3e\"/><rect x=\"10\" y=\"5\" width=\"1\" height=\"1\" fill=\"#d6b79b\"/><rect x=\"11\" y=\"5\" width=\"1\" height=\"1\" fill=\"#514750\"/><rect x=\"0\" y=\"6\" width=\"1\" height=\"1\" fill=\"#514750\"/><rect x=\"1\" y=\"6\" width=\"1\" height=\"1\" fill=\"#9c8581\"/><rect x=\"2\" y=\"6\" width=\"8\" height=\"1\" fill=\"#302c3e\"/><rect x=\"10\" y=\"6\" width=\"1\" height=\"1\" fill=\"#d6b79b\"/><rect x=\"11\" y=\"6\" width=\"1\" height=\"1\" fill=\"#514750\"/><rect x=\"0\" y=\"7\" width=\"1\" height=\"1\" fill=\"#514750\"/><rect x=\"1\" y=\"7\" width=\"1\" height=\"1\" fill=\"#d6b79b\"/><rect x=\"2\" y=\"7\" width=\"8\" height=\"1\" fill=\"#302c3e\"/><rect x=\"10\" y=\"7\" width=\"1\" height=\"1\" fill=\"#d6b79b\"/><rect x=\"11\" y=\"7\" width=\"1\" height=\"1\" fill=\"#514750\"/><rect x=\"0\" y=\"8\" width=\"1\" height=\"1\" fill=\"#514750\"/><rect x=\"1\" y=\"8\" width=\"1\" height=\"1\" fill=\"#9c8581\"/><rect x=\"2\" y=\"8\" width=\"8\" height=\"1\" fill=\"#302c3e\"/><rect x=\"10\" y=\"8\" width=\"1\" height=\"1\" fill=\"#d6b79b\"/><rect x=\"11\" y=\"8\" width=\"1\" height=\"1\" fill=\"#514750\"/><rect x=\"0\" y=\"9\" width=\"1\" height=\"1\" fill=\"#514750\"/><rect x=\"1\" y=\"9\" width=\"1\" height=\"1\" fill=\"#d6b79b\"/><rect x=\"2\" y=\"9\" width=\"8\" height=\"1\" fill=\"#302c3e\"/><rect x=\"10\" y=\"9\" width=\"1\" height=\"1\" fill=\"#d6b79b\"/><rect x=\"11\" y=\"9\" width=\"1\" height=\"1\" fill=\"#514750\"/><rect x=\"0\" y=\"10\" width=\"1\" height=\"1\" fill=\"#514750\"/><rect x=\"1\" y=\"10\" width=\"1\" height=\"1\" fill=\"#9c8581\"/><rect x=\"2\" y=\"10\" width=\"8\" height=\"1\" fill=\"#302c3e\"/><rect x=\"10\" y=\"10\" width=\"1\" height=\"1\" fill=\"#d6b79b\"/><rect x=\"11\" y=\"10\" width=\"1\" height=\"1\" fill=\"#514750\"/><rect x=\"0\" y=\"11\" width=\"1\" height=\"1\" fill=\"#514750\"/><rect x=\"1\" y=\"11\" width=\"1\" height=\"1\" fill=\"#d6b79b\"/><rect x=\"2\" y=\"11\" width=\"8\" height=\"1\" fill=\"#302c3e\"/><rect x=\"10\" y=\"11\" width=\"1\" height=\"1\" fill=\"#d6b79b\"/><rect x=\"11\" y=\"11\" width=\"1\" height=\"1\" fill=\"#514750\"/><rect x=\"0\" y=\"12\" width=\"1\" height=\"1\" fill=\"#514750\"/><rect x=\"1\" y=\"12\" width=\"1\" height=\"1\" fill=\"#9c8581\"/><rect x=\"2\" y=\"12\" width=\"8\" height=\"1\" fill=\"#302c3e\"/><rect x=\"10\" y=\"12\" width=\"1\" height=\"1\" fill=\"#d6b79b\"/><rect x=\"11\" y=\"12\" width=\"1\" height=\"1\" fill=\"#514750\"/><rect x=\"0\" y=\"13\" width=\"1\" height=\"1\" fill=\"#514750\"/><rect x=\"1\" y=\"13\" width=\"1\" height=\"1\" fill=\"#d6b79b\"/><rect x=\"2\" y=\"13\" width=\"8\" height=\"1\" fill=\"#edb360\"/><rect x=\"10\" y=\"13\" width=\"1\" height=\"1\" fill=\"#d6b79b\"/><rect x=\"11\" y=\"13\" width=\"1\" height=\"1\" fill=\"#514750\"/><rect x=\"0\" y=\"14\" width=\"1\" height=\"1\" fill=\"#514750\"/><rect x=\"1\" y=\"14\" width=\"1\" height=\"1\" fill=\"#9c8581\"/><rect x=\"2\" y=\"14\" width=\"8\" height=\"1\" fill=\"#f9d993\"/><rect x=\"10\" y=\"14\" width=\"1\" height=\"1\" fill=\"#9c8581\"/><rect x=\"11\" y=\"14\" width=\"1\" height=\"1\" fill=\"#514750\"/><rect x=\"0\" y=\"15\" width=\"1\" height=\"1\" fill=\"#514750\"/><rect x=\"1\" y=\"15\" width=\"10\" height=\"1\" fill=\"#d6b79b\"/><rect x=\"11\" y=\"15\" width=\"1\" height=\"1\" fill=\"#514750\"/></g><g class=\"lemming-door-b\"><rect x=\"4\" y=\"0\" width=\"4\" height=\"1\" fill=\"#514750\"/><rect x=\"2\" y=\"1\" width=\"2\" height=\"1\" fill=\"#514750\"/><rect x=\"4\" y=\"1\" width=\"2\" height=\"1\" fill=\"#d6b79b\"/><rect x=\"6\" y=\"1\" width=\"2\" height=\"1\" fill=\"#9c8581\"/><rect x=\"8\" y=\"1\" width=\"2\" height=\"1\" fill=\"#514750\"/><rect x=\"1\" y=\"2\" width=\"1\" height=\"1\" fill=\"#514750\"/><rect x=\"2\" y=\"2\" width=\"2\" height=\"1\" fill=\"#d6b79b\"/><rect x=\"4\" y=\"2\" width=\"1\" height=\"1\" fill=\"#edb360\"/><rect x=\"5\" y=\"2\" width=\"2\" height=\"1\" fill=\"#f9d993\"/><rect x=\"7\" y=\"2\" width=\"1\" height=\"1\" fill=\"#edb360\"/><rect x=\"8\" y=\"2\" width=\"1\" height=\"1\" fill=\"#d6b79b\"/><rect x=\"9\" y=\"2\" width=\"1\" height=\"1\" fill=\"#9c8581\"/><rect x=\"10\" y=\"2\" width=\"1\" height=\"1\" fill=\"#514750\"/><rect x=\"0\" y=\"3\" width=\"1\" height=\"1\" fill=\"#514750\"/><rect x=\"1\" y=\"3\" width=\"1\" height=\"1\" fill=\"#d6b79b\"/><rect x=\"2\" y=\"3\" width=\"1\" height=\"1\" fill=\"#9c8581\"/><rect x=\"3\" y=\"3\" width=\"1\" height=\"1\" fill=\"#514750\"/><rect x=\"4\" y=\"3\" width=\"4\" height=\"1\" fill=\"#302c3e\"/><rect x=\"8\" y=\"3\" width=\"1\" height=\"1\" fill=\"#514750\"/><rect x=\"9\" y=\"3\" width=\"1\" height=\"1\" fill=\"#9c8581\"/><rect x=\"10\" y=\"3\" width=\"1\" height=\"1\" fill=\"#d6b79b\"/><rect x=\"11\" y=\"3\" width=\"1\" height=\"1\" fill=\"#514750\"/><rect x=\"0\" y=\"4\" width=\"1\" height=\"1\" fill=\"#514750\"/><rect x=\"1\" y=\"4\" width=\"1\" height=\"1\" fill=\"#9c8581\"/><rect x=\"2\" y=\"4\" width=\"1\" height=\"1\" fill=\"#514750\"/><rect x=\"3\" y=\"4\" width=\"6\" height=\"1\" fill=\"#302c3e\"/><rect x=\"9\" y=\"4\" width=\"1\" height=\"1\" fill=\"#514750\"/><rect x=\"10\" y=\"4\" width=\"1\" height=\"1\" fill=\"#9c8581\"/><rect x=\"11\" y=\"4\" width=\"1\" height=\"1\" fill=\"#514750\"/><rect x=\"0\" y=\"5\" width=\"1\" height=\"1\" fill=\"#514750\"/><rect x=\"1\" y=\"5\" width=\"1\" height=\"1\" fill=\"#d6b79b\"/><rect x=\"2\" y=\"5\" width=\"8\" height=\"1\" fill=\"#302c3e\"/><rect x=\"10\" y=\"5\" width=\"1\" height=\"1\" fill=\"#d6b79b\"/><rect x=\"11\" y=\"5\" width=\"1\" height=\"1\" fill=\"#514750\"/><rect x=\"0\" y=\"6\" width=\"1\" height=\"1\" fill=\"#514750\"/><rect x=\"1\" y=\"6\" width=\"1\" height=\"1\" fill=\"#9c8581\"/><rect x=\"2\" y=\"6\" width=\"8\" height=\"1\" fill=\"#302c3e\"/><rect x=\"10\" y=\"6\" width=\"1\" height=\"1\" fill=\"#d6b79b\"/><rect x=\"11\" y=\"6\" width=\"1\" height=\"1\" fill=\"#514750\"/><rect x=\"0\" y=\"7\" width=\"1\" height=\"1\" fill=\"#514750\"/><rect x=\"1\" y=\"7\" width=\"1\" height=\"1\" fill=\"#d6b79b\"/><rect x=\"2\" y=\"7\" width=\"8\" height=\"1\" fill=\"#302c3e\"/><rect x=\"10\" y=\"7\" width=\"1\" height=\"1\" fill=\"#d6b79b\"/><rect x=\"11\" y=\"7\" width=\"1\" height=\"1\" fill=\"#514750\"/><rect x=\"0\" y=\"8\" width=\"1\" height=\"1\" fill=\"#514750\"/><rect x=\"1\" y=\"8\" width=\"1\" height=\"1\" fill=\"#9c8581\"/><rect x=\"2\" y=\"8\" width=\"8\" height=\"1\" fill=\"#302c3e\"/><rect x=\"10\" y=\"8\" width=\"1\" height=\"1\" fill=\"#d6b79b\"/><rect x=\"11\" y=\"8\" width=\"1\" height=\"1\" fill=\"#514750\"/><rect x=\"0\" y=\"9\" width=\"1\" height=\"1\" fill=\"#514750\"/><rect x=\"1\" y=\"9\" width=\"1\" height=\"1\" fill=\"#d6b79b\"/><rect x=\"2\" y=\"9\" width=\"8\" height=\"1\" fill=\"#302c3e\"/><rect x=\"10\" y=\"9\" width=\"1\" height=\"1\" fill=\"#d6b79b\"/><rect x=\"11\" y=\"9\" width=\"1\" height=\"1\" fill=\"#514750\"/><rect x=\"0\" y=\"10\" width=\"1\" height=\"1\" fill=\"#514750\"/><rect x=\"1\" y=\"10\" width=\"1\" height=\"1\" fill=\"#9c8581\"/><rect x=\"2\" y=\"10\" width=\"8\" height=\"1\" fill=\"#302c3e\"/><rect x=\"10\" y=\"10\" width=\"1\" height=\"1\" fill=\"#d6b79b\"/><rect x=\"11\" y=\"10\" width=\"1\" height=\"1\" fill=\"#514750\"/><rect x=\"0\" y=\"11\" width=\"1\" height=\"1\" fill=\"#514750\"/><rect x=\"1\" y=\"11\" width=\"1\" height=\"1\" fill=\"#d6b79b\"/><rect x=\"2\" y=\"11\" width=\"8\" height=\"1\" fill=\"#302c3e\"/><rect x=\"10\" y=\"11\" width=\"1\" height=\"1\" fill=\"#d6b79b\"/><rect x=\"11\" y=\"11\" width=\"1\" height=\"1\" fill=\"#514750\"/><rect x=\"0\" y=\"12\" width=\"1\" height=\"1\" fill=\"#514750\"/><rect x=\"1\" y=\"12\" width=\"1\" height=\"1\" fill=\"#9c8581\"/><rect x=\"2\" y=\"12\" width=\"8\" height=\"1\" fill=\"#302c3e\"/><rect x=\"10\" y=\"12\" width=\"1\" height=\"1\" fill=\"#d6b79b\"/><rect x=\"11\" y=\"12\" width=\"1\" height=\"1\" fill=\"#514750\"/><rect x=\"0\" y=\"13\" width=\"1\" height=\"1\" fill=\"#514750\"/><rect x=\"1\" y=\"13\" width=\"1\" height=\"1\" fill=\"#d6b79b\"/><rect x=\"2\" y=\"13\" width=\"8\" height=\"1\" fill=\"#f9d993\"/><rect x=\"10\" y=\"13\" width=\"1\" height=\"1\" fill=\"#d6b79b\"/><rect x=\"11\" y=\"13\" width=\"1\" height=\"1\" fill=\"#514750\"/><rect x=\"0\" y=\"14\" width=\"1\" height=\"1\" fill=\"#514750\"/><rect x=\"1\" y=\"14\" width=\"1\" height=\"1\" fill=\"#9c8581\"/><rect x=\"2\" y=\"14\" width=\"8\" height=\"1\" fill=\"#edb360\"/><rect x=\"10\" y=\"14\" width=\"1\" height=\"1\" fill=\"#9c8581\"/><rect x=\"11\" y=\"14\" width=\"1\" height=\"1\" fill=\"#514750\"/><rect x=\"0\" y=\"15\" width=\"1\" height=\"1\" fill=\"#514750\"/><rect x=\"1\" y=\"15\" width=\"10\" height=\"1\" fill=\"#d6b79b\"/><rect x=\"11\" y=\"15\" width=\"1\" height=\"1\" fill=\"#514750\"/></g></svg>",
    get out() { return walkers.length; },
    get home() { return home; },
  };
  ready(() => { if (!started) { started = true; start(); } });
})();
