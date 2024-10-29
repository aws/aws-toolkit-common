using System;
using System.IO;

namespace Amazon.AwsToolkit.Telemetry.Events.Generator.Tests.Utils
{
    public class TemporaryTestLocation : IDisposable
    {
        public readonly string TestFolder = Path.Combine(Path.GetTempPath(), Path.GetRandomFileName());
        public readonly string InputFolder;
        public readonly string OutputFolder;

        public TemporaryTestLocation(bool createInputOutputFolders = true)
        {
            Directory.CreateDirectory(TestFolder);

            if (createInputOutputFolders)
            {
                InputFolder = Path.Combine(TestFolder, "input");
                Directory.CreateDirectory(InputFolder);

                OutputFolder = Path.Combine(TestFolder, "output");
                Directory.CreateDirectory(OutputFolder);
            }
        }

        public void Dispose()
        {
            var path = TestFolder;
            if (Directory.Exists(path))
            {
                Directory.Delete(path, true);
            }
        }
    }
}
