import type React from 'react';
import { isToolCard, isToolsCategorie, type ToolCardProps, tools, ToolsCategorieProps } from '@/lib/tools-data';
import Link from 'next/link';

function ToolCard(tool: ToolCardProps) {
  function ToolCardLayout(tool: ToolCardProps) {
    return (
      <>
        <div className="flex items-center justify-left gap-2 mb-4">
          <div className="text-3xl">{tool.icon}</div>
          <h2 className="text-xl">{tool.name}</h2>
        </div>
        <p className="text-muted-foreground">{tool.description}</p>
      </>
    );
  }

  if (tool.available || process.env.NEXT_PUBLIC_ENVIRONMENT === 'development') {
    return (
      <Link
        href={tool.href}
        className="block p-6 bg-card border rounded-lg shadow hover:bg-accent/75 transition-colors duration-300 cursor-pointer"
      >
        <ToolCardLayout {...tool} />
      </Link>
    );
  }

  return (
    <div className={'select-none p-6 bg-card border rounded-lg transition-colors duration-300'}>
      <ToolCardLayout {...tool} />
    </div>
  );
}

function ToolsCategorie(categorie: ToolsCategorieProps) {
  return (
    <div className={'group/category'}>
      <header className={'flex flex-col md:flex-row items-baseline md:gap-4 lg:gap-6'}>
        <h2 className="page-title">{categorie.name}</h2>
        <p className="text-muted-foreground mb-6 lg:opacity-0 duration-300 lg:group-hover/category:opacity-100">
          {categorie.description}
        </p>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categorie.tools.map((tool, index) => (
          <ToolCard key={index} {...tool} />
        ))}
      </div>
    </div>
  );
}

export default function ToolsPage() {
  const toolsCard = tools.filter(tool => isToolCard(tool)).filter(tool => tool.href !== '/my/tools');
  const toolsCategorie = tools.filter(tool => isToolsCategorie(tool));
  return (
    <section className="page">
      <h1 className="page-title">Tools</h1>
      {toolsCard.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {toolsCard.map((tool, index) => (
            <ToolCard key={index} {...tool} />
          ))}
        </div>
      )}
      {toolsCategorie.map((categorie, index) => (
        <ToolsCategorie key={index} {...categorie} />
      ))}
    </section>
  );
}
