"""Entry point kept for the documented command `python3 src/gen_scrmap.py src`.
The generator lives in tools/generators/gen_scrmap.py (CL-04); this forwards to it with the same arguments."""
import os, runpy
runpy.run_path(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "tools", "generators", "gen_scrmap.py"), run_name="__main__")
