---
title: "Mimicking Biological Memory Consolidation in Spiking Neural Networks"
subtitle: "How bio-inspired neuronal locking solves catastrophic forgetting on neuromorphic hardware"
description: "A deep dive into our paper on P-Factor Consolidation: using local three-factor plasticity rules to lock functional engrams in Spiking Neural Networks without buffers or Hessians."
date: "October 2026"
category: "Neuromorphic AI"
draft: false
doi: "10.36227/techrxiv.177032973.30172948/v1"
journal: "TechRxiv"
bibtex: |
  @article{Singh2026Mimicking,
    author    = {Singh, Vishesh Kumar},
    title     = {Mimicking Biological Memory Consolidation in Spiking Neural Networks},
    journal   = {TechRxiv},
    year      = {2026},
    month     = {feb},
    doi       = {10.36227/techrxiv.177032973.30172948/v1},
    url       = {https://doi.org/10.36227/techrxiv.177032973.30172948/v1}
  }
tags:
  - Spiking Neural Networks
  - Continual Learning
  - Neuromorphic Computing
  - Cognitive Architectures
---

Think about how you learn. When you master a new skill, like learning to play the guitar or speaking a new language, you do not suddenly wake up the next morning having forgotten how to ride a bicycle or how to read. 

Your brain seamlessly balances two opposing physical needs:
1. **Plasticity**: The flexibility to rewire circuits and absorb fresh experiences.
2. **Stability**: The structural resilience to lock in past memories so they aren't erased.

In cognitive science and machine learning, this tension is famously known as the **Stability-Plasticity Dilemma** [@Mermillod2013]. 

While biological brains navigate this trade-off effortlessly through a multi-stage process called **memory consolidation** [@Frankland2005], modern artificial neural networks fail spectacularly at it. When a standard neural network is trained on Task A and then sequentially trained on Task B, the gradient updates for the new task indiscriminately overwrite the old synaptic weights. Within just a few iterations, performance on Task A plunges to near zero. This catastrophic failure mode is known as **Catastrophic Forgetting** [@McCloskey1989].

In our paper, [**Mimicking Biological Memory Consolidation in Spiking Neural Networks** (Read PDF ↗)](blogs/images/snn_memory/MIMICKING-BIOLOGICAL_MEMORY_CONSOLIDATION_IN_SNNS.pdf), we tackle this challenge in **Spiking Neural Networks (SNNs)**. We introduce a lightweight, bio-inspired mechanism called **P-Factor Consolidation** that creates permanent memory circuits ("engrams") using simple, local activity rules, requiring **no data replay buffers** and **no second-order gradient calculations**.

Here is the intuitive story of why standard methods break in spiking networks, how biology inspired our solution, and what our empirical findings reveal.

---

## 1. Why Spiking Neural Networks?

Most contemporary deep learning models (like Transformers and ConvNets) process continuous real-valued numbers. In contrast, **Spiking Neural Networks (SNNs)** represent the "third generation" of neural models [@Maass1997]. They communicate using sparse, discrete, all-or-nothing electrical pulses (spikes), emulating real biological neurons.

![Neuromorphic Architecture and Temporal Coding](collateral_dist.png)

This event-driven communication offers staggering energy efficiency. On specialized neuromorphic hardware like Intel's **Loihi** [@Davies2018], silicon neurons only consume energy when an electrical spike occurs. In between spikes, circuits remain idle. This makes SNNs prime candidates for edge computing, robotics, and ultra-low-power biomedical devices [@Roy2019].

However, lifelong learning in SNNs is uniquely difficult. Standard training algorithms use **surrogate gradient descent** [@Neftci2019] to smooth out the non-differentiable step function of a spike threshold. When subjected to sequential tasks, SNNs suffer from immediate catastrophic forgetting. For instance, on the standard Split-MNIST benchmark (learning digits 0-4, then learning digits 5-9), a standard SNN's retention on the first task collapses to **0.00%**.

---

## 2. Why Conventional Machine Learning Fixes Fail in SNNs

In standard deep learning, continual learning is typically handled using three mainstream paradigms. But when transferred to spiking hardware, each one hits a biological or computational wall:

### A. Gradient-Based Regularization (EWC & Synaptic Intelligence)
Methods like Elastic Weight Consolidation (EWC) [@Kirkpatrick2017] and Synaptic Intelligence (SI) [@Zenke2017] calculate which weights are important by computing loss curvature (the Fisher Information Matrix or path integrals of gradients).
- **The SNN Flaw**: Spikes are non-differentiable. Surrogate gradients are merely rough, noisy local approximations. When you accumulate squared surrogate gradients across 100 discrete timesteps over thousands of iterations, the resulting curvature estimates become intensely noisy.
- **The Consequence**: As shown in our baseline comparison below, low regularization penalties fail to stop forgetting, while high penalties freeze the network so rigidly that it cannot learn the new task at all (dropping Task B accuracy to under 8%).

![Gradient-Based Baselines Performance Summary](baselines_comparison.png)

### B. Experience Replay Buffers
Replay methods [@Rebuffi2017] keep a cache of raw past samples and rehearse them during new tasks.
- **The SNN Flaw**: Edge neuromorphic chips have severely limited on-chip memory (SRAM). Hoarding raw sensory data defeats the purpose of autonomous edge intelligence. Furthermore, continuous replay can cause *surrogate gradient starvation*, where dominant early-task neurons permanently suppress late-task neurons.

### C. Magnitude-Based Pruning (PackNet)
Structural methods like PackNet [@Mallya2018] prune and freeze weights based on their numerical magnitude (assuming large weights are important).
- **The SNN Flaw**: Because spiking neurons fire only when their membrane potential crosses a discrete threshold $V_{th}$, a weight can be numerically large while remaining functionally silent. Magnitude alone is a flawed proxy for spiking importance.

---

## 3. The Biological Blueprint: Synaptic Tagging and Engrams

In the mammalian brain, memory retention isn't governed by global loss functions or Hessian matrices. Instead, it relies on localized chemical processes:

1. **Synaptic Tagging & Capture (STC)**: When a neural pathway is repeatedly stimulated during a meaningful event, a chemical "tag" (such as CaMKII or PKM$\zeta$ protein kinases) is deposited at the synapse [@Frey1997; @Clopath2008].
2. **Long-Term Potentiation (LTP)**: If the event is reinforced by a neuromodulatory reward (like dopamine), these tagged synapses undergo physical consolidation.
3. **Engram Formation**: Over time, these reinforced pathways lock into a stable structural sub-network called an **engram**, permanently preserving the memory while unassigned "novice" neurons remain plastic to learn new things.

---

## 4. Our Approach: P-Factor Consolidation

To bring this biological wisdom into SNNs without adding $\mathcal{O}(N^2)$ memory overhead, we designed **P-Factor Consolidation** as an $\mathcal{O}(N)$ neuron-centric mechanism.

Instead of tracking every single synapse, we associate a dynamic scalar called the **Potentiation Factor ($P_i$)** with each hidden neuron $i$.

```text
[Input Sample x] ───► [Hidden Layer (1024 LIF Neurons)] ───► [Output Classifier]
                              │
                    Tracks Spikes & Reward
                              ▼
                   P-Factor Update (LTP / LTD)
                              │
                  At Task Boundary: "Sleep" Phase
            ┌─────────────────┴─────────────────┐
            ▼                                   ▼
   Top τ% (Expert Neurons)            Remaining Novice Neurons
   Incoming Weights FROZEN            Weights Left UNLOCKED
   (Structural Engram Locked)         (Homeostatic Plasticity)
```

### 1. Three-Factor Plasticity Rule
During training, the evolution of $P_i$ follows a local Three-Factor Rule [@Fremaux2016] combining pre-synaptic input, post-synaptic firing rate $R_i$, and a global supervisory signal:

- **Long-Term Potentiation (LTP / Reward)**: When the network correctly classifies a sample, active neurons are rewarded:
  $$P_i \leftarrow P_i + \alpha_{LTP} \cdot R_i \cdot (P_{max} - P_i)$$
  The term $(P_{max} - P_i)$ acts as a soft saturation boundary, ensuring only consistently reliable neurons reach expert status.

- **Long-Term Depression (LTD / Punishment)**: When the network makes an erroneous prediction, active neurons that contributed to the error are penalized:
  $$P_i \leftarrow \max(P_i - \alpha_{LTD} \cdot R_i, P_{min})$$
  This swiftly strips unstable or noisy neurons of their expert status.

### 2. Forward-Pass Scaling (Winner-Take-All)
During inference, the effective synaptic weights are dynamically scaled by their potentiation:
$$\mathbf{W}_{eff}[i, :] = \mathbf{W}[i, :] \cdot (1 + P_i)$$

This simple scaling produces a powerful "winner-take-all" dynamic. Highly potentiated expert neurons respond with amplified strength to familiar patterns, while novice neurons stay quiet, preventing interference.

### 3. Offline Consolidation ("Sleep" at the Task Boundary)
When a task finishes, the network undergoes an offline consolidation phase:
1. **Engram Identification**: We compute a percentile threshold $\tau$ (e.g., the 80th percentile) over all $P$-values. Neurons with $P_i \ge \theta$ are designated as the **Engram**.
2. **Structural Locking**: The incoming weights $\mathbf{W}_{i,:}$ of all engram neurons are frozen ($\nabla \mathbf{W}_{i,:} = 0$). Their feature selectivity is physically locked for all future tasks.
3. **Homeostatic Plasticity (No-Reset)**: Novice neurons are left unlocked to learn the next task. Crucially, we **do not** artificially reset their weights to zero; letting them naturally drift provides a warm start for future learning.

---

## 5. What the Experiments Revealed

We evaluated P-Factor Consolidation across three challenging benchmarks: **Split-MNIST**, the neuromorphic spatio-temporal dataset **Split-N-MNIST**, and the dense, overlapping **5-Split Fashion-MNIST**.

### Finding 1: Utility Beats Magnitude (P-Factor vs. PackNet)
Does freezing by biological utility actually beat magnitude-based pruning (PackNet)?

![Comparison of Structural Engram Allocation Strategies](structural_comparison.png)

As shown above, P-Factor consistently outperforms PackNet across all capacity budgets ($\tau \in \{0.2, 0.4, 0.6, 0.8\}$). At $\tau=0.8$ (freezing 80% of the network), P-Factor achieves **79.88%** global combined accuracy, compared to PackNet's **65.86%**. 

Why does magnitude pruning fail? In SNNs, firing rates follow a steep long-tail distribution:

![Task A Firing-Rate Distribution](firing_rate_distribution.png)

Only about 20% of the neurons perform the heavy lifting of classification. While Random Freezing captures 80.08% of these critical neurons by pure probability, **P-Factor identifies and protects 100.00% of them**, completely safeguarding the functional circuit.

---

### Finding 2: The Two Faces of Memory (Task-IL vs. Class-IL)
When tracking Task A retention over multiple epochs of training on Task B, we observed a fascinating divergence:

![Task A Retention Trajectories](longitudinal_trajectory.png)

1. **Absolute Structural Protection (Task-IL)**: When evaluated within the task (Task-IL, green line), retention remains rock-solid at **~95%** across all 5 epochs. This proves that the physical engram never degrades.
2. **Plasticity Creep (Class-IL)**: When the network must choose between all 10 classes simultaneously (Class-IL, blue line), retention peaks at Epoch 3 (64.46%) and then gradually declines. Why? Because excessive training on Task B causes the unconstrained output layer to inflate its weights, biasing the global decision boundary toward the newest task.

---

### Finding 3: Ablations Confirm the Biological Mechanics
To verify what makes P-Factor work, we systematically ablated its components:

![Ablation Study: Scaling and Reset Mechanics](ablations_comparison.png)

- **Removing Forward-Pass Scaling ("No-Scale")**: Combined accuracy collapsed from **79.88% to 63.25%**, driven by a crash in Task A retention (from 64.46% down to 30.36%). Amplifying expert neurons during training is mandatory to prevent novice neurons from interfering.
- **Forcing Neurogenesis ("Reset-Zero")**: Re-initializing novice weights to zero dropped combined accuracy to **69.51%**. Allowing novice neurons to naturally drift ("No-Reset") preserves weak shared representations that help subsequent learning.

---

### Finding 4: Scaling to Dense Features (5-Split Fashion-MNIST)
In 5-Split Fashion-MNIST, the network must consolidate knowledge across 4 sequential task boundaries over overlapping clothing categories (e.g., T-shirts, Pullovers, and Coats):

![5-Split Fashion-MNIST Progression](fashion_progression.png)

- Early tasks (Tasks 1-3) maintain strong Task-IL retention throughout the sequence (>83-94%).
- However, as more neurons are locked at each boundary ($\tau=0.15$ per step), the remaining plastic capacity shrinks to ~40% by Task 5. In dense feature spaces, this exposes an architectural ceiling: once plastic capacity drops below a critical threshold, learning new classes can collapse unless dynamic capacity expansion (neurogenesis) is introduced.

---

### Finding 5: High-Entropy Neuromorphic Streams (N-MNIST)
We also tested event-based camera data from N-MNIST, which contains asynchronous temporal noise:

![N-MNIST Structural Comparison](nmnist_structural_comparison.png)

Even under noisy spatio-temporal streams, the internal engram physically survives with **>95% Task-IL retention** at high capacities, confirming that activity-based tagging protects core sensory feature extractors.

---

### Finding 6: The "Collateral Locking" Paradox
Biological synaptic tagging operates at individual dendritic spines ($\mathcal{O}(N^2)$). Our neuron-level approximation locks all incoming synapses for an expert neuron ($\mathcal{O}(N)$), including ~23.5% of synapses that have near-zero weights.

Is this structural waste bad? We implemented an "Ideal Synaptic P-Factor" baseline to find out:

| Method | Memory Footprint | Task A Retention (Class-IL) | Task B Accuracy (Class-IL) |
| :--- | :---: | :---: | :---: |
| **Ideal Synaptic P-Factor** ($\mathcal{O}(N^2)$) | $\sim 3.2$ MB | 53.99% | 93.96% |
| **Neuron-Level P-Factor (Ours)** ($\mathcal{O}(N)$) | **4 KB** | **64.46%** | **95.30%** |

Surprisingly, **neuron-level locking achieves 10.5% higher retention** than true synapse-level locking! Why? 

When non-critical synapses inside an active neuron are left plastic, subsequent tasks induce subtle synaptic drift, gradually polluting the neuron's tuning curve. By rigidly locking the entire neuron, collateral locking prevents partial drift, delivering **better retention with an 800× smaller memory footprint**!

---

## 6. Computational & Energy Advantages for Neuromorphic Chips

Deploying continual learning on neuromorphic edge devices requires strict adherence to hardware constraints:

| Metric | EWC / Synaptic Intelligence | Experience Replay | P-Factor (Ours) |
| :--- | :---: | :---: | :---: |
| **State Memory Overhead** | $\mathcal{O}(W)$ ($\sim 6.2$ MB) | $\mathcal{O}(\|B\| \times D)$ ($\sim 156$ KB) | **$\mathcal{O}(N)$ (~4 KB)** |
| **Replay Buffer Required?** | No | Yes (200 samples) | **No** |
| **Hessian / Fisher Required?** | Yes (Second-order) | No | **No (Local activity only)** |
| **Backward Pass Energy** | $1.0\times$ | $> 1.0\times$ (Replay passes) | **$< 1.0\times$ (80% weights frozen)** |

Because 80% of the hidden weights are frozen during Task B, they are completely excluded from gradient calculation and backpropagation, drastically lowering training energy costs.

---

## 7. The Road Ahead

P-Factor Consolidation proves that simple, local, biologically inspired plasticity rules can successfully organize and protect memory in Spiking Neural Networks without relying on raw data storage or complex mathematical curvature.

The key takeaways from our work:
1. **Surrogate gradients fail for curvature estimation**: Standard gradient regularization (EWC/SI) breaks down in spiking networks.
2. **Activity utility beats weight magnitude**: Freezing neurons based on spiking reliability preserves critical circuits that magnitude pruning misses.
3. **Neuron-level locking is an asset, not a compromise**: Collateral locking shields engrams from partial drift while slashing memory overhead to a negligible 4 KB.

As neuromorphic hardware continues to scale, combining activity-driven structural consolidation with dynamic capacity expansion (neurogenesis) offers a promising, energy-efficient path toward truly autonomous lifelong learning on the edge.

---

> [!TIP]
> **Full Research Manuscript & Resources**:
> - 📄 [**Read the Full Paper (Hosted PDF ↗)**](blogs/images/snn_memory/MIMICKING-BIOLOGICAL_MEMORY_CONSOLIDATION_IN_SNNS.pdf): *Hosted manuscript version reflecting the latest updated paper.*
> - 💻 [**Source Code on GitHub ↗**](https://github.com/vishesh-kumar-singh/Mimicking-Biological-Memory-Consolidation-in-SNNs): *Complete PyTorch / SpikingJelly implementation and experimental scripts.*
