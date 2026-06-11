const AuthBanner = () => {
  return (
    <div className="hidden lg:flex flex-col justify-center items-center bg-slate-50 px-16">

      <img
        src="/images/logo.png"
        alt="ERP Logo"
        className="w-72 mb-8"
      />

      <h2 className="text-3xl font-bold text-slate-800">
        School Management System
      </h2>

      <p className="text-slate-600 text-center mt-4 max-w-lg">
        From attendance to academics, our platform helps
        institutions operate smarter, faster and more securely.
      </p>

      <div className="flex gap-16 mt-12">
        <div>
          <h3 className="text-4xl font-bold text-blue-600">
            100+
          </h3>
          <p>Schools</p>
        </div>

        <div>
          <h3 className="text-4xl font-bold text-blue-600">
            500K+
          </h3>
          <p>Students</p>
        </div>

        <div>
          <h3 className="text-4xl font-bold text-blue-600">
            99.9%
          </h3>
          <p>Uptime</p>
        </div>
      </div>

    </div>
  );
};

export default AuthBanner;