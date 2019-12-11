import React from 'react';
import styled from 'styled-components';

const Button = styled.button`
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
  position: relative;
  outline: 0;
  width: 1.25rem;
  height: 100%;
  -webkit-box-align: center;
  -ms-flex-align: center;
  align-items: center;
  background-color: #f7f9fa;
  border: 0;
  padding: 0;
  border-right: 1px solid #d3dce0;
  cursor: -webkit-grab;
  cursor: grab;
  -webkit-transition: background-color 0.2s ease-in-out;
  transition: background-color 0.2s ease-in-out;

  svg {
    fill: #8091a5;
    height: 18px;
    width: 18px;
    display: inline-block;
  }
`;

const FocusTrap = styled.span`
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  -webkit-box-align: center;
  -ms-flex-align: center;
  align-items: center;
  display: inherit;
  outline: 0;
`;

const VisuallyHiddden = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
`;

const DragHandle = props => (
  <Button className={props.className}>
    <FocusTrap tabindex="-1">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
        <path fill="none" d="M0 0h24v24H0V0z" />
        <path d="M11 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-2-8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6 4c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
      </svg>
      <VisuallyHiddden>Reorder item</VisuallyHiddden>
    </FocusTrap>
  </Button>
);

export default DragHandle;
