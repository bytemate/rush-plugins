import React, { useEffect } from 'react';
import CyGraph from './graph';
import { IGraph } from './types';

interface IProps {
  graph: IGraph,
}

const Graph: React.FC<IProps> = (props) => {
  const ref: React.RefObject<HTMLDivElement> = React.useRef(null);

  useEffect(() => {
    if (!ref.current) {
      throw Error();
    }

    const cy: CyGraph = new CyGraph(props.graph, ref.current.id);

    cy.handleEvent({
      type: 'notifyGraphInitGraph',
    });

    return () => {
      cy.destroy();
    }
  }, [props.graph])

  return (
    <div className='flex-grow overflow-hidden'>
      <div ref={ref} id="graph-container"></div>
    </div>
  )
}

export default Graph;