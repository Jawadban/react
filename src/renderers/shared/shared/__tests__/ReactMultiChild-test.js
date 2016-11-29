/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails react-core
 */

'use strict';

describe('ReactMultiChild', () => {
  function normalizeCodeLocInfo(str) {
    return str && str.replace(/\(at .+?:\d+\)/g, '(at **)');
  }

  var React;
  var ReactDOM;

  beforeEach(() => {
    jest.resetModuleRegistry();
    React = require('React');
    ReactDOM = require('ReactDOM');
  });

  describe('reconciliation', () => {
    it('should update children when possible', () => {
      var container = document.createElement('div');

      var mockMount = jest.fn();
      var mockUpdate = jest.fn();
      var mockUnmount = jest.fn();

      var MockComponent = React.createClass({
        componentDidMount: mockMount,
        componentDidUpdate: mockUpdate,
        componentWillUnmount: mockUnmount,
        render: function() {
          return <span />;
        },
      });

      expect(mockMount.mock.calls.length).toBe(0);
      expect(mockUpdate.mock.calls.length).toBe(0);
      expect(mockUnmount.mock.calls.length).toBe(0);

      ReactDOM.render(<div><MockComponent /></div>, container);

      expect(mockMount.mock.calls.length).toBe(1);
      expect(mockUpdate.mock.calls.length).toBe(0);
      expect(mockUnmount.mock.calls.length).toBe(0);

      ReactDOM.render(<div><MockComponent /></div>, container);

      expect(mockMount.mock.calls.length).toBe(1);
      expect(mockUpdate.mock.calls.length).toBe(1);
      expect(mockUnmount.mock.calls.length).toBe(0);
    });

    it('should replace children with different constructors', () => {
      var container = document.createElement('div');

      var mockMount = jest.fn();
      var mockUnmount = jest.fn();

      var MockComponent = React.createClass({
        componentDidMount: mockMount,
        componentWillUnmount: mockUnmount,
        render: function() {
          return <span />;
        },
      });

      expect(mockMount.mock.calls.length).toBe(0);
      expect(mockUnmount.mock.calls.length).toBe(0);

      ReactDOM.render(<div><MockComponent /></div>, container);

      expect(mockMount.mock.calls.length).toBe(1);
      expect(mockUnmount.mock.calls.length).toBe(0);

      ReactDOM.render(<div><span /></div>, container);

      expect(mockMount.mock.calls.length).toBe(1);
      expect(mockUnmount.mock.calls.length).toBe(1);
    });

    it('should NOT replace children with different owners', () => {
      var container = document.createElement('div');

      var mockMount = jest.fn();
      var mockUnmount = jest.fn();

      var MockComponent = React.createClass({
        componentDidMount: mockMount,
        componentWillUnmount: mockUnmount,
        render: function() {
          return <span />;
        },
      });

      class WrapperComponent extends React.Component {
        render() {
          return this.props.children || <MockComponent />;
        }
      }

      expect(mockMount.mock.calls.length).toBe(0);
      expect(mockUnmount.mock.calls.length).toBe(0);

      ReactDOM.render(<WrapperComponent />, container);

      expect(mockMount.mock.calls.length).toBe(1);
      expect(mockUnmount.mock.calls.length).toBe(0);

      ReactDOM.render(
        <WrapperComponent><MockComponent /></WrapperComponent>,
        container
      );

      expect(mockMount.mock.calls.length).toBe(1);
      expect(mockUnmount.mock.calls.length).toBe(0);
    });

    it('should replace children with different keys', () => {
      var container = document.createElement('div');

      var mockMount = jest.fn();
      var mockUnmount = jest.fn();

      var MockComponent = React.createClass({
        componentDidMount: mockMount,
        componentWillUnmount: mockUnmount,
        render: function() {
          return <span />;
        },
      });

      expect(mockMount.mock.calls.length).toBe(0);
      expect(mockUnmount.mock.calls.length).toBe(0);

      ReactDOM.render(<div><MockComponent key="A" /></div>, container);

      expect(mockMount.mock.calls.length).toBe(1);
      expect(mockUnmount.mock.calls.length).toBe(0);

      ReactDOM.render(<div><MockComponent key="B" /></div>, container);

      expect(mockMount.mock.calls.length).toBe(2);
      expect(mockUnmount.mock.calls.length).toBe(1);
    });

    it('should warn for duplicated keys with component stack info', () => {
      spyOn(console, 'error');

      var container = document.createElement('div');

      class WrapperComponent extends React.Component {
        render() {
          return <div>{this.props.children}</div>;
        }
      }

      class Parent extends React.Component {
        render() {
          return (
            <div>
              <WrapperComponent>
                {this.props.children}
              </WrapperComponent>
            </div>
          );
        }
      }

      ReactDOM.render(
        <Parent>{[<div key="1"/>]}</Parent>,
        container
      );

      ReactDOM.render(
        <Parent>{[<div key="1"/>, <div key="1"/>]}</Parent>,
        container
      );

      expectDev(console.error.calls.count()).toBe(1);
      expectDev(normalizeCodeLocInfo(console.error.calls.argsFor(0)[0])).toBe(
        'Warning: flattenChildren(...): ' +
        'Encountered two children with the same key, `1`. ' +
        'Child keys must be unique; when two children share a key, ' +
        'only the first child will be used.\n' +
        '    in div (at **)\n' +
        '    in WrapperComponent (at **)\n' +
        '    in div (at **)\n' +
        '    in Parent (at **)'
      );
    });

    it('should warn for using maps as children with owner info', () => {
      spyOn(console, 'error');

      class Parent extends React.Component {
        render() {
          return (
            <div>{new Map([['foo', 0], ['bar', 1]])}</div>
          );
        }
      }

      var container = document.createElement('div');
      ReactDOM.render(<Parent />, container);

      expectDev(console.error.calls.count()).toBe(1);
      expectDev(console.error.calls.argsFor(0)[0]).toBe(
        'Warning: Using Maps as children is not yet fully supported. It is an ' +
        'experimental feature that might be removed. Convert it to a sequence ' +
        '/ iterable of keyed ReactElements instead. Check the render method of `Parent`.'
      );
    });
  });
});