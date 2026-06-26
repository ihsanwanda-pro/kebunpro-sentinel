{ pkgs }: {
  deps = [
    pkgs.python310
    pkgs.python310Packages.flask
    pkgs.python310Packages.requests
    pkgs.python310Packages.pandas
    pkgs.python310Packages.gunicorn
  ];
}
