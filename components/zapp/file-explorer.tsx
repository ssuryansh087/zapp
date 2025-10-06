"use client";

import { File, Folder, ChevronDown, ChevronRight } from "lucide-react";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

type FileNode = {
  name: string;
  path: string;
  type: "file";
};

type FolderNode = {
  name: string;
  type: "folder";
  children: (FileNode | FolderNode)[];
};

type TreeNode = FileNode | FolderNode;

// Helper to build a tree from a flat path list
const buildFileTree = (files: { [key: string]: any }): TreeNode[] => {
  const root: any = {};
  const sortedPaths = Object.keys(files).sort();

  for (const path of sortedPaths) {
    let current = root;
    path.split("/").forEach((part, index, arr) => {
      const isFile = index === arr.length - 1;
      if (!current[part]) {
        current[part] = isFile ? { type: "file" } : {};
      }
      current = current[part];
    });
  }

  const createNodes = (node: any, pathPrefix = ""): TreeNode[] => {
    return Object.keys(node).map((name) => {
      const currentPath = pathPrefix ? `${pathPrefix}/${name}` : name;
      if (node[name].type === "file") {
        return { name, path: currentPath, type: "file" };
      } else {
        return {
          name,
          type: "folder",
          children: createNodes(node[name], currentPath),
        };
      }
    });
  };

  return createNodes(root);
};

const FileTree = ({
  node,
  activeFile,
  onFileSelect,
}: {
  node: TreeNode;
  activeFile: string | null;
  onFileSelect: (path: string) => void;
}) => {
  const isFolder = node.type === "folder";
  const [isOpen, setIsOpen] = useState(isFolder);

  if (!isFolder) {
    const fileNode = node as FileNode;
    const isActive = activeFile === fileNode.path;
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        onClick={() => onFileSelect(fileNode.path)}
        className={cn(
          "flex items-center gap-2 py-1.5 px-3 rounded-md cursor-pointer transition-colors duration-200",
          isActive ? "bg-white/20" : "hover:bg-white/10"
        )}
      >
        <File className="w-4 h-4 text-white/70 flex-shrink-0" />
        <span className="text-sm text-white/90 truncate">{fileNode.name}</span>
      </motion.div>
    );
  }

  const folderNode = node as FolderNode;
  return (
    <div>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 py-1.5 px-3 rounded-md cursor-pointer hover:bg-white/10 transition-colors duration-200"
      >
        {isOpen ? (
          <ChevronDown className="w-4 h-4 text-white/50 flex-shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-white/50 flex-shrink-0" />
        )}
        <Folder className="w-4 h-4 text-white/70 flex-shrink-0" />
        <span className="text-sm font-medium text-white/90 truncate">
          {folderNode.name}
        </span>
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="ml-4 pl-2 border-l border-white/10"
          >
            {folderNode.children.map((childNode) => (
              <FileTree
                key={childNode.name}
                node={childNode}
                activeFile={activeFile}
                onFileSelect={onFileSelect}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function FileExplorer({
  files,
  activeFile,
  onFileSelect,
}: {
  files: { [key: string]: any } | null;
  activeFile: string | null;
  onFileSelect: (path: string) => void;
}) {
  const fileTree = useMemo(() => (files ? buildFileTree(files) : []), [files]);

  if (!files) {
    return (
      <div className="p-4 text-sm text-white/50">Generating project...</div>
    );
  }

  return (
    <div className="p-2 space-y-1">
      {fileTree.map((node) => (
        <FileTree
          key={node.name}
          node={node}
          activeFile={activeFile}
          onFileSelect={onFileSelect}
        />
      ))}
    </div>
  );
}
