//import node modules
import React from 'react';
import immutable from 'immutable';

//import style
import './style';

//define component property
const property = {};

//define action type
const componentAction = {};

//component body
export class <%= ComponentName %> extends React.Component {
  render() {
    return (
      <div className="<%= ComponentName %>"></div>
    );
  }
}

export function <%= ComponentName %>Reducer(state = property, action){
  let tempState = immutable.fromJS(state);

  if(tempState.getIn(['id']) === action.id){
    
  }else{

  }
}