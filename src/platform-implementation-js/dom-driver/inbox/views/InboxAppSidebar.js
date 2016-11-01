/* @flow */

import cx from 'classnames';
import React from 'react';
import saveRefs from 'react-save-refs';
import DraggableList from 'react-draggable-list';
import SmoothCollapse from 'react-smooth-collapse';
import get from '../../../../common/get-or-fail';
import idMap from '../../../lib/idMap';

const springConfig = {stiffness: 400, damping: 50};

type PanelDescriptor = {
  instanceId: string;
  id: string;
  title: string;
  iconClass: ?string;
  iconUrl: ?string;
  el: HTMLElement;
};
type Props = {
  panels: PanelDescriptor[];
  onClose(): void;
  onOutsideClick(): void;
  onMoveEnd(newList: PanelDescriptor[], item: PanelDescriptor, oldIndex: number, newIndex: number): void;
};
export default class InboxAppSidebar extends React.Component {
  props: Props;
  _list: DraggableList;
  _main: HTMLElement;
  scrollPanelIntoView(instanceId: string) {
    const panel: Panel = this._list.getItemInstance(instanceId);
    panel.scrollIntoView();
  }
  shouldComponentUpdate(nextProps: Props) {
    return this.props.panels !== nextProps.panels;
  }
  render() {
    const {panels, onClose, onOutsideClick, onMoveEnd} = this.props;
    const showControls = panels.length > 1;
    return (
      <div className={idMap('app_sidebar')}>
        <div
          className={idMap('app_sidebar_main')}
          ref={el => this._main = el}
        >
          <div className={idMap('app_sidebar_content_area')}>
            <DraggableList
              ref={el => this._list = el}
              itemKey={x => x.panelDescriptor.instanceId}
              template={Panel}
              list={panels.map(panelDescriptor => ({panelDescriptor, showControls}))}
              onMoveEnd={(newList, movedItem, oldIndex, newIndex) => {
                onMoveEnd(newList.map(x => x.panelDescriptor), movedItem.panelDescriptor, oldIndex, newIndex);
              }}
              springConfig={springConfig}
              container={()=>this._main}
            />
          </div>
          <div
            className={idMap('app_sidebar_content_area_padding')}
            onClick={event => {
              event.preventDefault();
              onOutsideClick();
            }}
          />
        </div>
        <button
          className="inboxsdk__close_button"
          type="button"
          title="Close"
          onClick={onClose}
        />
      </div>
    );
  }
}

type PanelProps = {
  item: {
    panelDescriptor: PanelDescriptor;
    showControls: boolean;
  };
  dragHandle: Function;
  itemSelected: number;
};
type PanelState = {
  expanded: boolean;
};
class Panel extends React.Component {
  props: PanelProps;
  _el: HTMLElement;
  state: PanelState = {
    expanded: true
  };
  scrollIntoView() {
    this._el.scrollIntoView();
  }
  getDragHeight() {
    return 16;
  }
  shouldComponentUpdate(nextProps: PanelProps, nextState: PanelState) {
    return this.props.itemSelected !== nextProps.itemSelected ||
      this.props.item.panelDescriptor !== nextProps.item.panelDescriptor ||
      this.props.item.showControls !== nextProps.item.showControls ||
      this.state.expanded !== nextState.expanded;
  }
  render() {
    const {
      dragHandle, itemSelected, item: {
        showControls, panelDescriptor: {title, iconClass, iconUrl, el}
      }
    } = this.props;
    const toggleExpansion = event => {
      this.setState({expanded: !this.state.expanded});
    };
    const scale = itemSelected * 0.01 + 1;
    const shadow = itemSelected * 4;

    return (
      <div
        ref={el => this._el = el}
        className={cx(idMap('app_sidebar_content_panel'), {
          [idMap('expanded')]: this.state.expanded,
          [idMap('showControls')]: showControls
        })}
        style={{
          transform: `scale(${scale})`,
          boxShadow: shadow === 0 ? 'none' : `0px 0px ${shadow}px 0px rgba(0, 0, 0, 0.3)`
        }}
      >
        <div className={idMap('app_sidebar_content_panel_top_line')}>
          {(showControls ? dragHandle : (x=>x))(
            <span className={idMap('app_sidebar_content_panel_title')}>
              <span className={cx(idMap('app_sidebar_content_panel_title_icon'), iconClass)}>
                {iconUrl && <img src={iconUrl} />}
              </span>
              <span className={idMap('app_sidebar_content_panel_title_text')}>
                {title}
              </span>
            </span>
          )}
          <span
            className={idMap('app_sidebar_content_panel_toggle')}
            onClick={toggleExpansion}
          >
            <button
              type="button"
              className={idMap('app_sidebar_content_panel_toggle_button')}
            />
          </span>
        </div>
        <SmoothCollapse
          expanded={!showControls || this.state.expanded}
          heightTransition=".15s ease"
        >
          <PanelElement el={el} />
        </SmoothCollapse>
      </div>
    );
  }
}

type PanelElementProps = {
  el: HTMLElement;
};
class PanelElement extends React.Component {
  _content: HTMLElement;
  componentDidMount() {
    this._content.appendChild(this.props.el);
  }
  componentDidUpdate(prevProps: PanelElementProps) {
    if (prevProps.el !== this.props.el) {
      while (this._content.lastElementChild) {
        this._content.lastElementChild.remove();
      }
      this._content.appendChild(this.props.el);
    }
  }
  shouldComponentUpdate(nextProps: PanelElementProps) {
    return this.props.el !== nextProps.el;
  }
  render() {
    return (
      <div
        className={idMap('app_sidebar_content_panel_content')}
        ref={el => this._content = el}
      />
    );
  }
}
