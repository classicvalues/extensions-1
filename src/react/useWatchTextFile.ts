import React from "react";
import { HandshakeStatus, WriteChangeArgs } from "src/types";
import useReplit from "./useReplit";

interface UseWatchTextFileLoading {
  content: null;
  watching: false;
  watchError: null;
  writeChange: (args: WriteChangeArgs) => Promise<never>;
}

interface UseWatchTextFileWatching {
  content: string;
  watching: true;
  watchError: null;
  writeChange: (args: WriteChangeArgs) => Promise<void>;
}

interface UseWatchTextFileError {
  content: null;
  watching: false;
  watchError: Error;
  writeChange: (args: WriteChangeArgs) => Promise<never>;
}

export default function useWatchTextFile({
  filePath,
}: {
  filePath: string | null | undefined;
}) {
  const [content, setContent] = React.useState<string | null>(null);
  const [watching, setWatching] = React.useState(false);
  const [watchError, setWatchError] = React.useState<Error | null>(null);

  const { status, replit } = useReplit();

  const connected = status === HandshakeStatus.Ready;

  const writeChange = React.useRef<
    (args: WriteChangeArgs) => Promise<void | never>
  >(async (_: WriteChangeArgs) => {
    throw new Error("writeChange is called before onReady");
  });

  React.useEffect(() => {
    if (!connected || !filePath) {
      return;
    }

    let watchFileDispose: null | (() => void) = null;
    let dispose = () => {
      if (watchFileDispose) {
        watchFileDispose();
        watchFileDispose = null;
      }
      setWatching(false);
      setContent(null);
      setWatchError(null);
      writeChange.current = async (_: WriteChangeArgs) => {
        throw new Error("writeChange is called before onReady");
      };
    };

    (async () => {
      if (!replit || !filePath) {
        return;
      }

      try {
        watchFileDispose = await replit.fs.watchTextFile(filePath, {
          onReady: async (args) => {
            setContent(await args.initialContent);
            writeChange.current = async (writeChangeArgs: WriteChangeArgs) => {
              await args.writeChange(writeChangeArgs);
            };
            setWatching(true);
          },
          onError(err) {
            setWatchError(new Error(err));
            setWatching(false);
            dispose();
          },
          onChange: (args) => {
            setContent(args.latestContent);
          },
          onMoveOrDelete: () => {
            setWatching(false);
          },
        });
      } catch (e) {
        setWatchError(e as Error);
        setWatching(false);
      }
    })();

    return dispose;
  }, [connected, filePath, replit]);

  return React.useMemo(() => {
    const result = {
      content,
      watching,
      watchError,
      writeChange: async (args: WriteChangeArgs) =>
        await writeChange.current(args),
    };
    if (watching) {
      return result as UseWatchTextFileWatching;
    } else if (watchError) {
      return result as UseWatchTextFileError;
    } else {
      return result as UseWatchTextFileLoading;
    }
  }, [content, watching, watchError, writeChange]);
}
