import React from 'react';

interface IProjectItemProps {
  name: string,
}

const ProjectItem: React.FC<IProjectItemProps> = (props) => {
  return (
    <li className='relative block cursor-default select-none py-1 pl-3 pr-9 text-xs text-gray-600'>
      <div className="flex items-center">
        <label
          className="block w-full cursor-pointer truncate rounded-md p-2 font-mono font-normal transition hover:bg-gray-50"
          data-project={props.name}
          data-active="true"
        >
          {props.name}
        </label>
      </div>
    </li>
  )
}

interface IProjectListProps {
  projects: string[],
}

const ProjectList: React.FC<IProjectListProps> = (props) => {
  return (
    <div id="project-list" className='mt-8 border-t border-gray-200 px-4'>
      <h1 className='border-b border-solid border-gray-50 text-lg font-bold'>
        Rush Projects
      </h1>
      <ul className='mt-2 -ml-3'>
        {props.projects.map((p) => <ProjectItem name={p} key={p}/>)}
      </ul>
    </div>

  )
}

interface ISiderbarProps {
  projects: string[]
}

const Siderbar: React.FC<ISiderbarProps> = (props) => {
  return (
    <div
      className='relative flex h-full flex-col overflow-scroll pb-10 shadow-lg ring-1 ring-gray-400 ring-opacity-10'
    >
      <div className='bg-blue-base'>
        <div className="mx-4 my-5 flex items-center justify-start text-white">
          <span className="ml-4 text-xl font-medium decoration-black">Dep Graph for Rush</span>
        </div>
      </div>
      <ProjectList {...props}/>
    </div>
  )
}

export default Siderbar;