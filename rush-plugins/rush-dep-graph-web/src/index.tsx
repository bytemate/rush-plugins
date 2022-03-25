import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import Graph from './graph';
import type { IGraph } from './graph/types';
import Siderbar from './sidebar';
import './style.css';

interface IState {
  graph: IGraph,
}

const App: React.FC = () => {
  const [proejctState, setProjectState] = useState<IState>({graph: {nodes: [], edges: []}})

  useEffect(() => {
    //@ts-ignore
    if (typeof window.graphData !== 'undefined') {
      //@ts-ignore
      setProjectState({ graph: window.graphData })
    } else {
      // @ts-ignore
      import('../assets/test.json')
        .then(graph => {
          setProjectState({
            graph
          })
        })
        .catch(() => {});
    }

  }, [])

  return (
    <React.Fragment>
      <Siderbar projects={proejctState.graph.nodes.map(node => node.name)}/>
      <Graph graph={proejctState.graph}/>
    </React.Fragment>
  )
}
ReactDOM.render(<App />, document.getElementById('root'));
