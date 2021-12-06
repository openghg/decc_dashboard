# DECC Network Dashboard

A data dashboard for the [DECC network](http://www.bristol.ac.uk/chemistry/research/acrg/current/decc.html), based on the [OpenGHG data dashboard](https://github.com/openghg/dashboard).

## Run locally

To run the app locally please make sure you have [node installed](https://nodejs.org/en/). Then you can clone this repo and run

```bash
$ npm install
```

This will install all of the dependencies required to run the app. You can then start the app using

```bash
$ npm start
```

You should then be able to access the app at [http://localhost:3000](http://localhost:3000).

##s Testing

If you'd like to make changes and/or add components to this project please make sure each component is tested. We make use
of the React Testing Library to test the application as a user would interact with it. Please refer to [their documentation](https://testing-library.com/docs/react-testing-library/intro/) for instructions on how to get started.

You can run the tests using

```bash
$ npm run test
```

## Code Quality

Code quality is checked using ESLint, this can be run using

```bash
$ npm run lint
```

## Live Data

