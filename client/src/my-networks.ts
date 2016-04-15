import { autoinject } from "aurelia-framework";
import { HttpClient, json } from "aurelia-fetch-client";
import { Network, Graph, ComponentFactory, RunState } from "cryptographix-sim-core";
import { ByteArrayEntry } from "./components/bytearray-entry";
import { ByteArrayViewer } from "./components/bytearray-viewer";
import { CryptoBox } from "./components/crypto-box";
import { EMVCardSimulator } from "./components/emv-card-simulator";
import { APDUSender } from "./components/apdu-sender";
import { NetworkConfigDialog } from "./config-dialogs/network-config-dialog";
import { DialogService } from "aurelia-dialog";
import "fetch";

@autoinject
export class MyNetworks {

  public network: Network;
  public networks: Array<Network> = [];
  public label: string = "My Networks";
  public graphSelected: boolean;
  // is used to display spinning icon when a network is being saved
  public isSaving: boolean = false;
  public self = this;

  private dialogService: DialogService;
  private fetchCalled: boolean;

  constructor(private http: HttpClient, dialogService: DialogService) {
    http.configure(config => {
      config
        .useStandardConfiguration()
        .withBaseUrl("http://localhost:8080/api/")
        .withDefaults({
          headers: {
            "authorization": localStorage.getItem("jwt")
          }
        });
    });
    this.http = http;
    this.fetchNetworks();
    this.dialogService = dialogService;
  }

  public attached(): void {
    // offset according to the width and height of the text
    document.getElementById("page-title").style.marginLeft = "-280px";
    document.getElementById("page-title").style.marginTop = "-40px";
    /* 
     * attached and fetchNetworks get called in a different order depending
     * on whether the page is loaded/refreshed, or transitioned to from another
     * page, therefore the fetchCalled boolean is needed
     */
    if (this.fetchCalled && this.networks.length === 0) {
      document.getElementById("newNetworkButton").classList.add("pulse");
    }
  }

  public newNetwork(): void {
    document.getElementById("newNetworkButton").classList.remove("pulse");
    this.dialogService.open({ model: this.getTakenNames(), viewModel: NetworkConfigDialog}).then(response => {
      if (!response.wasCancelled) {
      let network = { graph: { "id": response.output } };
        this.configureNetwork(network);
        this.saveNewGraph(network.graph);
      }
    });
  }

  public deleteNetwork(network: Network): void {
    this.http.fetch("deleteNetwork", {
      body: json(network.graph.toObject({}))
      method: "delete",
    }).then(response => response.json())
      .then(data => {
        this.networks.splice(this.networks.indexOf(network), 1);
    });
  }

  public loadNetwork(network: Network): void {
    this.network = network;
    // the network object is then bound to the canvas custom element in the view
    this.label = this.network.graph.id;
    this.graphSelected = true;
  }

  public back(): void {
    if (this.network.graph.context.runState === RunState.RUNNING) {
      this.network.stop();
    }
    this.graphSelected = false;
    this.label = "My Networks";
  }

  public save(network: Network): void {
    this.isSaving = true;
    this.http.fetch("updateNetwork", {
      body: json(this.network.graph.toObject({})),
      method: "post"
    }).then(response => response.json())
      .then(data => {
        console.log(data);
        this.isSaving = false;
      });
  }

  /******************** Private Implementation ********************/

  private fetchNetworks(): void {
    this.http.fetch("getUserNetworks", {
        method: "get"
    }).then(response => response.json())
      .then(data => {
        this.fetchCalled = true;
        if (data.length === 0) {
          document.getElementById("newNetworkButton").classList.add("pulse");
        }
        for (let network of data) {
          this.configureNetwork(network);
        }
      });
  }

  private configureNetwork(network: any): void {
    let graph = new Graph(null, network.graph);
    let factory = new ComponentFactory();
    factory.register( "ByteArrayEntry", ByteArrayEntry );
    factory.register( "ByteArrayViewer", ByteArrayViewer );
    factory.register( "CryptoBox", CryptoBox );
    factory.register( "EMVCardSimulator", EMVCardSimulator);
    factory.register("APDUSender", APDUSender);
    this.networks.push(new Network(factory, graph));
  }

  private saveNewGraph(graph: {}): void {
    this.http.fetch("addNetwork", {
      body: json(graph)
      method: "post",
    }).then(response => response.json())
      .then(data => {
        console.log(data);
    });
  }

  private getTakenNames(): Array<string> {
    let takenNames = [];
    this.networks.forEach(network => {
      takenNames.push(network.graph.id);
    });
    return takenNames;
  }
}

