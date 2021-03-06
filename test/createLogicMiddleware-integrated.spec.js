import expect from 'expect';
import { createStore, applyMiddleware } from 'redux';
import { createLogic, createLogicMiddleware } from '../src/index';

describe('createLogicMiddleware-integration', () => {
  describe('rapid call with single logic', () => {
    let storeUpdates;
    let monArr = [];
    beforeEach((done) => {
      monArr = [];
      storeUpdates = [];
      const initialState = { count: 1 };

      function reducer(state, action) {
        switch (action.type) {
        case 'DEC':
          return {
            ...state,
            count: state.count - 1
          };
        default:
          return state;
        }
      }

      const validateDecLogic = createLogic({
        type: 'DEC',
        validate({ getState, action }, allow, reject) {
          if (getState().count > 0) {
            allow(action);
          } else {
            reject({ type: 'NOOP' });
          }
        }
      });

      const logicMiddleware = createLogicMiddleware([validateDecLogic]);
      logicMiddleware.monitor$.subscribe(x => monArr.push(x));

      const store = createStore(reducer, initialState,
                                applyMiddleware(logicMiddleware));
      store.subscribe(() => {
        storeUpdates.push({
          ...store.getState()
        });
        if (storeUpdates.length === 2) {
          // done();
          // using whenComplete to trigger done
        }
      });

      store.dispatch({ type: 'DEC' });
      store.dispatch({ type: 'DEC' });
      logicMiddleware.whenComplete(done);
    });

    it('should only decrement once', () => {
      expect(storeUpdates[0].count).toBe(0);
      expect(storeUpdates[1].count).toBe(0);
    });

    it('mw.monitor$ should track flow', () => {
      expect(monArr).toEqual([
        { action: { type: 'DEC' }, op: 'top' },
        { action: { type: 'DEC' }, name: 'L(DEC)-0', op: 'begin' },
        { action: { type: 'DEC' },
          nextAction: { type: 'DEC' },
          name: 'L(DEC)-0',
          shouldProcess: true,
          op: 'next' },
        { nextAction: { type: 'DEC' }, op: 'bottom' },
        { action: { type: 'DEC' }, op: 'top' },
        { action: { type: 'DEC' }, name: 'L(DEC)-0', op: 'begin' },
        { action: { type: 'DEC' },
          dispAction: { type: 'NOOP' },
          name: 'L(DEC)-0',
          shouldProcess: false,
          op: 'nextDisp' },
        { action: { type: 'DEC' },
          dispAction: { type: 'NOOP' },
          op: 'dispatch' },
        { action: { type: 'NOOP' }, op: 'top' },
        { nextAction: { type: 'NOOP' }, op: 'bottom' },
        { action: { type: 'DEC' }, name: 'L(DEC)-0', op: 'end' },
        { action: { type: 'DEC' }, name: 'L(DEC)-0', op: 'end' }
      ]);
    });
  });

  describe('rapid call with 2 logic', () => {
    let storeUpdates;
    let monArr = [];
    beforeEach((done) => {
      monArr = [];
      storeUpdates = [];
      const initialState = { count: 1 };

      function reducer(state, action) {
        switch (action.type) {
        case 'DEC':
          return {
            ...state,
            count: state.count - 1
          };
        default:
          return state;
        }
      }

      const validateDecLogic = createLogic({
        type: 'DEC',
        validate({ getState, action }, allow, reject) {
          if (getState().count > 0) {
            allow(action);
          } else {
            reject({ type: 'NOOP' });
          }
        }
      });

      const anotherLogic = createLogic({
        type: '*',
        transform({ action }, next) {
          next(action);
        }
      });


      const arrLogic = [
        validateDecLogic,
        anotherLogic
      ];
      const logicMiddleware = createLogicMiddleware(arrLogic);
      logicMiddleware.monitor$.subscribe(x => monArr.push(x));

      const store = createStore(reducer, initialState,
                                applyMiddleware(logicMiddleware));
      store.subscribe(() => {
        storeUpdates.push({
          ...store.getState()
        });
        if (storeUpdates.length === 4) {
          // done();
          // using whenComplete to trigger done
        }
      });

      store.dispatch({ type: 'DEC' });
      store.dispatch({ type: 'DEC' });
      store.dispatch({ type: 'DEC' });
      store.dispatch({ type: 'DEC' });
      logicMiddleware.whenComplete(done);
    });

    it('should only decrement once', () => {
      expect(storeUpdates[0].count).toBe(0);
      expect(storeUpdates[1].count).toBe(0);
      expect(storeUpdates[2].count).toBe(0);
      expect(storeUpdates[3].count).toBe(0);
    });

    it('mw.monitor$ should track flow', () => {
      expect(monArr).toEqual([
        { action: { type: 'DEC' }, op: 'top' },
        { action: { type: 'DEC' }, name: 'L(DEC)-0', op: 'begin' },
        { action: { type: 'DEC' },
          nextAction: { type: 'DEC' },
          name: 'L(DEC)-0',
          shouldProcess: true,
          op: 'next' },
        { action: { type: 'DEC' }, name: 'L(*)-1', op: 'begin' },
        { action: { type: 'DEC' },
          nextAction: { type: 'DEC' },
          name: 'L(*)-1',
          shouldProcess: true,
          op: 'next' },
        { nextAction: { type: 'DEC' }, op: 'bottom' },
        { action: { type: 'DEC' }, op: 'top' },
        { action: { type: 'DEC' }, name: 'L(DEC)-0', op: 'begin' },
        { action: { type: 'DEC' },
          dispAction: { type: 'NOOP' },
          name: 'L(DEC)-0',
          shouldProcess: false,
          op: 'nextDisp' },
        { action: { type: 'DEC' },
          dispAction: { type: 'NOOP' },
          op: 'dispatch' },
        { action: { type: 'NOOP' }, op: 'top' },
        { action: { type: 'NOOP' }, name: 'L(*)-1', op: 'begin' },
        { action: { type: 'NOOP' },
          nextAction: { type: 'NOOP' },
          name: 'L(*)-1',
          shouldProcess: true,
          op: 'next' },
        { nextAction: { type: 'NOOP' }, op: 'bottom' },
        { action: { type: 'DEC' }, name: 'L(DEC)-0', op: 'end' },
        { action: { type: 'DEC' }, op: 'top' },
        { action: { type: 'DEC' }, name: 'L(DEC)-0', op: 'begin' },
        { action: { type: 'DEC' },
          dispAction: { type: 'NOOP' },
          name: 'L(DEC)-0',
          shouldProcess: false,
          op: 'nextDisp' },
        { action: { type: 'DEC' },
          dispAction: { type: 'NOOP' },
          op: 'dispatch' },
        { action: { type: 'NOOP' }, op: 'top' },
        { action: { type: 'NOOP' }, name: 'L(*)-1', op: 'begin' },
        { action: { type: 'NOOP' },
          nextAction: { type: 'NOOP' },
          name: 'L(*)-1',
          shouldProcess: true,
          op: 'next' },
        { nextAction: { type: 'NOOP' }, op: 'bottom' },
        { action: { type: 'DEC' }, name: 'L(DEC)-0', op: 'end' },
        { action: { type: 'DEC' }, op: 'top' },
        { action: { type: 'DEC' }, name: 'L(DEC)-0', op: 'begin' },
        { action: { type: 'DEC' },
          dispAction: { type: 'NOOP' },
          name: 'L(DEC)-0',
          shouldProcess: false,
          op: 'nextDisp' },
        { action: { type: 'DEC' },
          dispAction: { type: 'NOOP' },
          op: 'dispatch' },
        { action: { type: 'NOOP' }, op: 'top' },
        { action: { type: 'NOOP' }, name: 'L(*)-1', op: 'begin' },
        { action: { type: 'NOOP' },
          nextAction: { type: 'NOOP' },
          name: 'L(*)-1',
          shouldProcess: true,
          op: 'next' },
        { nextAction: { type: 'NOOP' }, op: 'bottom' },
        { action: { type: 'DEC' }, name: 'L(DEC)-0', op: 'end' },
        { action: { type: 'DEC' }, name: 'L(*)-1', op: 'end' },
        { action: { type: 'DEC' }, name: 'L(DEC)-0', op: 'end' },
        { action: { type: 'NOOP' }, name: 'L(*)-1', op: 'end' },
        { action: { type: 'NOOP' }, name: 'L(*)-1', op: 'end' },
        { action: { type: 'NOOP' }, name: 'L(*)-1', op: 'end' }
      ]);
    });

  });

});
