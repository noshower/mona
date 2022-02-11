import React from 'react';
import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import { useAppEvent, AppLifecycle } from '@bytedance/mona';
import { createAppLifeCycle } from '../createWebAppEvent';
import { configure, mount } from 'enzyme';
import mountTest from '../../../../tests/shared/mountTest';
import { NoMatch } from '../createWebApp';

configure({ adapter: new Adapter() });

describe('createPageLifecycle', () => {
  let launchMock = jest.fn();
  let PageNotFoundMock = jest.fn();

  beforeEach(() => {
    launchMock = jest.fn();
    PageNotFoundMock = jest.fn();
  });

  function App({ name }) {
    useAppEvent(AppLifecycle.launch, (...rest) => {
      launchMock(...rest, 'launch');
    });
    useAppEvent(AppLifecycle.pageNotFound, (...rest) => {
      PageNotFoundMock(...rest, 'pageNotFound');
    });
    return <>fc组件{name}</>;
  }
  class AppClass extends React.Component<{ name: string }> {
    onLaunch(...rest) {
      launchMock(...rest, 'onLoad');
    }
    onPageNotFound(...rest) {
      PageNotFoundMock(...rest, 'class', 'pageNotFound');
    }
    render() {
      return <>class组件{this.props.name}</>;
    }
  }

  mountTest(createAppLifeCycle(App));
  mountTest(createAppLifeCycle(AppClass));

  it('createPageLifecycle FC lifeCycle', () => {
    const PageComponent = createAppLifeCycle(App);
    const AppIns = mount(<PageComponent name="mona" />);

    expect(AppIns.render()).toMatchSnapshot();

    // AppIns.props
    expect(AppIns.prop('name')).toBe('mona');

    expect(launchMock.mock.calls.length).toBe(1);
    AppIns.unmount();
  });
  it(`createPageLifecycle Class lifeCycle `, () => {
    const PageComponent = createAppLifeCycle(AppClass);
    const AppIns = mount(<PageComponent name="mona" />);
    expect(AppIns.render()).toMatchSnapshot();

    expect(AppIns.prop('name')).toBe('mona');

    expect(launchMock.mock.calls.length).toBe(1);

    AppIns.unmount();
  });

  it('func pageNotFound', () => {
    const PageClassComponent = createAppLifeCycle(AppClass);
    mount(<PageClassComponent name="mona" />);
    mount(<NoMatch defaultPath="/path/a/b" />);
    // console.log(PageNotFoundMock.mock.calls);

    expect(PageNotFoundMock.mock.calls.length).toBe(1);
    expect(PageNotFoundMock.mock.calls).toMatchSnapshot();
    // PageNotFoundMock
  });
  it('class pageNotFound', () => {
    const PageComponent = createAppLifeCycle(App);
    mount(<PageComponent name="mona" />);
    mount(<NoMatch defaultPath="/path/a/b" />);
    // console.log(PageNotFoundMock.mock.calls);

    expect(PageNotFoundMock.mock.calls.length).toBe(1);
    expect(PageNotFoundMock.mock.calls).toMatchSnapshot();

    // PageNotFoundMock
  });
  // it('pageNotFound', () => {
  //   mount(<NoMatch defaultPath="/path/a/b" />);
  // });
});

