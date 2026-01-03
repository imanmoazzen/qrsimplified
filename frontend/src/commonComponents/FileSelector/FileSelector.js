import { sha256 } from "js-sha256";

class FileSelector {
  constructor() {
    this.files = [];
  }

  choose = (filter, onSuccess = () => {}) => {
    this.files = [];

    const inputElement = document.createElement("input");
    inputElement.type = "file";
    inputElement.accept = filter;
    inputElement.multiple = false;
    inputElement.click();
    inputElement.addEventListener("input", () => {
      this.files = [...inputElement.files];
      onSuccess();
    });
  };

  setFiles = (files) => {
    this.files = files;
  };

  getAll = () => {
    return this.files;
  };

  getImages = () => {
    return this.files.filter((file) => file.type.split("/")[0] === "image");
  };

  getPDFs = () => {
    return this.files.filter((file) => (getExtension(file) === "pdf" ? true : false));
  };

  getFiles = (extensions) => {
    return this.files.filter((file) => (extensions.includes(getExtension(file)) ? true : false));
  };

  remove(file) {
    const index = this.files.indexOf(file);
    this.files.splice(index, 1);
  }
}

export const getId = (file) => sha256(file.lastModified + file.name);

export const getExtension = (file) => file.name.split(".")[1];

export const getName = (file) => (file.name ? file.name.split(".")[0] : "file");

export const fileSelector = new FileSelector();
