import { isClassComponent } from '../reactNode';
import React from 'react';

class TComponent extends React.Component {
  render() {
    return <div>跟我一起念123,321</div>;
  }
}
class TComponent2 {
  render() {
    return <div>跟我一起念123,321</div>;
  }
}
function FComponent() {
  return <div>跟我一起念123,321</div>;
}
it('isClassComponent', () => {
  expect(isClassComponent(TComponent)).toBeTruthy();
  expect(isClassComponent(TComponent2)).toBeFalsy();

  expect(isClassComponent(FComponent)).toBeFalsy();
});
