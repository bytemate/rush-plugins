# Background

Our WebArch Engineering team wants to guide users in TikTok Monorepo to enable rush build cache feature for their projects. The main work is to configure a `rush-project.json` for each project. The challenge here is to correctly configure this file, because
- There are a variety of building toolchain that are used in TikTok Monorepo. Library maintainers may not be familiar with the details of each building tool.
- A wong cache artifact may cause frustration for developers. It may take hours to realize that an error is caused by a malfunctioning cache, which lowers the confidence of using build cache and may even lead to a decision to totally disable build cache feature.

# Term: Hermeticity

A build is hermetic if it is not affected by details of the environment where it is performed.

Bazel has a official doc about it https://bazel.build/basics/hermeticity. 

# Why is keeping project hermetic important?

- **Speed**: Hermeticity is a prerequisite for generally desirable features like remote caching and remote execution. This means that the inhermeticity of a project leads to malfunctioning remote cache. One should be aware of reusing remote build cache for a in-hermetic project.
- **Multiple build**: You can build multiple hermetic builds on the same machine, each build using different tools and versions. Imaging running multiple builds with a tool which writes logs to one constant file path, such as "/tmp/compiler.log".
- **Reproducibility**: Hermetic builds are good for troubleshooting because you know the exact conditions that produced the build.

# How to identify non-hermeticity?

In general, detecting non-hermeticity is hard. The major sources includes:
- **File system**: If tools are invoked in a way that does not limit their access to the contents of the file system, the output of these tools can be influenced by extraneous files that might be present during the build. Imagine the toolchain **reads** a base config file under another project folder which is not declared as one of the "devDependencies" of the building project. Alternatively, suppose the compiler **writes** an output to a folder path that is not saved/restored by the cache.
- **Environment**: It is very hard to ensure identical environments on different machines, especially developer machines. Restoring a cached output may produce incorrect results if the output is influenced by a shell environment variable that is not represented by the cache key. 
- **Others**: There are many other sources of non-termeticity. For example,
  - Arbitrary execustion outside of building process: For example, `pnpm install` may build native components with whichever compiler is in "PATH", linking against whichever system libraries are found.
  - Performing any non-deterministic actions: Creating archives(zip, tar, etc) is a good example: The order of directory listings as well as timestamps are usually non- deterministic.  The [reprodubile-builds](https://reproducible-builds.org/docs/archives/) project is a great resource to learn about these issues and how to circumvent them.

# Detecting hermeticity issues

Now, we can understand the difficulty of detecting hermeticity issues. But we still need to try our best to help users to do it. That's where a rush build diagnostic tool comes into rescue.

## Trace file system calls

With the help of external trace tools, we can trace system calls, especially the interactions between the build process and file system. A log is the ground truth about what files are accessed during the build. Developers can understand the building process better by checking all the file inputs and outputs. Moreover, the diagnostic tool can generate a friendly report by comparing the analyzed result with the project configuration.

Ref: [Rush audit-cache tech note](./rush-audit-cache-tech-note.md)

## Limit environment variables

A general way to eliminate the influence of environment variables on different machines is to control the inheritance of the environment variables. This may need a new feature proposal in Rush.js to explicitly inherit the values of a given list of environment variables. Extra care must be taken in this case to guarantee that value stays reasonably stable. e.g. it is not an absolute path which can vary from machine to machine.

# Reference

- [How to keep a Bazel project hermetic](https://www.tweag.io/blog/2022-09-15-hermetic-bazel/)